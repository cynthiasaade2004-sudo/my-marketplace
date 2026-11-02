import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from '@/src/prisma/db';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.acacia' as any,
});

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return new NextResponse('Missing Stripe signature or webhook secret', { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid signature';
    return new NextResponse(`Webhook Error: ${message}`, { status: 400 });
  }

  if (
    event.type === 'checkout.session.completed' ||
    event.type === 'checkout.session.async_payment_succeeded'
  ) {
    const session = event.data.object;
    const orderId = session.metadata?.orderId;
    const paymentSucceeded =
      event.type === 'checkout.session.async_payment_succeeded' ||
      session.payment_status === 'paid';

    if (orderId && paymentSucceeded) {
      await db.orm.public.Order
        .where({ id: orderId })
        .update({ status: 'PAID' });
    }
  }

  return new NextResponse(null, { status: 200 });
}
