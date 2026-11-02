import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from '@/src/prisma/db';
import { auth } from '@/auth';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-09-30.endive',
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ storeId: string }> }
) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: 'Request body must be valid JSON' },
      { status: 400, headers: corsHeaders }
    );
  }

  if (!body || typeof body !== 'object') {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400, headers: corsHeaders }
    );
  }

  const { items: requestItems, productIds } = body as {
    items?: unknown;
    productIds?: unknown;
  };
  const items = Array.isArray(requestItems)
    ? requestItems
    : Array.isArray(productIds)
      ? productIds.map((productId) => ({ productId, quantity: 1 }))
      : null;

  if (
    !items ||
    items.length === 0 ||
    !items.every(
      (item) =>
        item !== null &&
        typeof item === 'object' &&
        'productId' in item &&
        typeof item.productId === 'string' &&
        item.productId.length > 0 &&
        'quantity' in item &&
        typeof item.quantity === 'number' &&
        Number.isSafeInteger(item.quantity) &&
        item.quantity > 0
    )
  ) {
    return NextResponse.json(
      { error: 'Valid product IDs and quantities are required' },
      { status: 400, headers: corsHeaders }
    );
  }

  const requestedItems = items as { productId: string; quantity: number }[];
  const productIdsToLoad = requestedItems.map((item) => item.productId);

  if (new Set(productIdsToLoad).size !== productIdsToLoad.length) {
    return NextResponse.json(
      { error: 'Product IDs must not contain duplicates' },
      { status: 400, headers: corsHeaders }
    );
  }

  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json(
      { error: 'Sign in before checking out' },
      { status: 401, headers: corsHeaders }
    );
  }

  try {
    const { storeId } = await params;
    const runtime = db.runtime();
    const account = await db.orm.public.User
      .select('id', 'preferredPaymentMethod')
      .where({ id: userId })
      .first();
    if (!account) {
      return NextResponse.json(
        { error: 'Your account could not be found' },
        { status: 401, headers: corsHeaders }
      );
    }

    const productsPlan = db.sql.public.Product
      .select('id', 'storeId', 'title', 'price')
      .build();
    const allProducts = await runtime.query(productsPlan);
    const productsById = new Map(
      allProducts
        .filter((product) => product.storeId === storeId)
        .map((product) => [product.id, product])
    );
    const products = requestedItems.map((item) => ({
      product: productsById.get(item.productId),
      quantity: item.quantity,
    }));

    if (products.some(({ product }) => !product)) {
      return NextResponse.json(
        { error: 'One or more products are invalid for this store' },
        { status: 400, headers: corsHeaders }
      );
    }

    const pricedProducts = products.map(({ product, quantity }) => {
      if (!product) {
        throw new Error('Product validation failed unexpectedly');
      }
      const unitAmount = Math.round(Number(product.price) * 100);
      if (!Number.isSafeInteger(unitAmount) || unitAmount < 1) {
        throw new Error(`Product ${product.id} has an invalid price`);
      }

      return { product, quantity, unitAmount };
    });
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = pricedProducts.map(
      ({ product, quantity, unitAmount }) => ({
        quantity,
        price_data: {
          currency: 'usd',
          product_data: { name: product.title },
          unit_amount: unitAmount,
        },
      })
    );

    const totalCents = pricedProducts.reduce(
      (total, { unitAmount, quantity }) => total + unitAmount * quantity,
      0
    );
    if (!Number.isSafeInteger(totalCents)) {
      return NextResponse.json(
        { error: 'Order total is too large' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (account.preferredPaymentMethod === 'CASH') {
      const cashOrder = await db.transaction(async (tx) => {
        const order = await tx.orm.public.Order.create({
          userId,
          storeId,
          total: String(totalCents / 100),
          status: 'PENDING',
          paymentMethod: 'CASH',
        });

        for (const { product, quantity, unitAmount } of pricedProducts) {
          await tx.orm.public.OrderItem.create({
            orderId: order.id,
            productId: product.id,
            quantity,
            price: String(unitAmount / 100),
          });
        }

        return order;
      });

      return NextResponse.json(
        { orderId: cashOrder.id, paymentMethod: 'CASH' },
        { headers: corsHeaders }
      );
    }

    const orderInsert = db.sql.public.Order
      .insert([{
        userId,
        storeId,
        total: String(totalCents / 100),
        status: 'PENDING',
        paymentMethod: 'CARD',
      }])
      .returning('id')
      .build();
    const [order] = await runtime.query(orderInsert);

    if (!order?.id) {
      throw new Error('Order creation did not return an ID');
    }

    const frontendStoreUrl = (process.env.FRONTEND_STORE_URL ?? 'http://localhost:3000')
      .replace(/\/+$/, '');
    const session = await stripe.checkout.sessions.create({
      line_items: lineItems,
      mode: 'payment',
      success_url: `${frontendStoreUrl}/cart?success=1`,
      cancel_url: `${frontendStoreUrl}/cart?canceled=1`,
      metadata: { orderId: order.id },
    });

    if (!session.url) {
      return NextResponse.json(
        { error: 'Stripe did not return a checkout URL. Please try again.' },
        { status: 502, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      { paymentMethod: 'CARD', url: session.url },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('[CHECKOUT_POST]', error);
    return NextResponse.json(
      { error: 'Internal error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
