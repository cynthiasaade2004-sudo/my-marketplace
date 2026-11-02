'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import type { CartItem } from '@/src/hooks/use-cart';
import { useCart } from '@/src/hooks/use-cart';

export default function CartPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-4xl mx-auto px-4 py-16 text-gray-500">
          Loading cart...
        </div>
      }
    >
      <CartPageContent />
    </Suspense>
  );
}

function CartPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const cart = useCart();
  const { removeAll } = cart;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const successHandled = useRef(false);
  const canceledHandled = useRef(false);

  useEffect(() => {
    if (searchParams.get('success') && !successHandled.current) {
      successHandled.current = true;
      removeAll();
      alert('Payment completed successfully!');
    } else if (searchParams.get('canceled') && !canceledHandled.current) {
      canceledHandled.current = true;
      alert('Payment was canceled.');
    }
  }, [searchParams, removeAll]);

  const totalPrice = cart.items.reduce((total: number, item: CartItem) => {
    return total + Number(item.price) * item.quantity;
  }, 0);
  const storeId = searchParams.get('storeId') ?? cart.items[0]?.storeId;
  const hasMixedStores = cart.items.some((item) => item.storeId !== storeId);
  const canCheckout =
    status === 'authenticated' &&
    Boolean(session?.user?.id) &&
    Boolean(storeId) &&
    !hasMixedStores &&
    cart.items.length > 0 &&
    !loading;

  async function onCheckout() {
    if (!canCheckout || !storeId) {
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/stores/${encodeURIComponent(storeId)}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.items.map((item) => ({
            productId: item.id,
            quantity: item.quantity,
          })),
        }),
      });
      const data = (await response.json()) as {
        url?: string;
        orderId?: string;
        paymentMethod?: 'CASH' | 'CARD';
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? 'Could not start checkout.');
      }

      if (data.paymentMethod === 'CASH' && data.orderId) {
        cart.removeAll();
        router.push(
          `/${encodeURIComponent(storeId)}/cart/success?orderId=${encodeURIComponent(data.orderId)}&type=cash`
        );
        return;
      }
      if (data.paymentMethod !== 'CARD' || !data.url) {
        throw new Error('Checkout did not return a valid payment destination.');
      }

      window.location.assign(data.url);
    } catch (checkoutError) {
      console.error('[CHECKOUT_ERROR]', checkoutError);
      setError(
        checkoutError instanceof Error
          ? checkoutError.message
          : 'Something went wrong during checkout.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>

      {cart.items.length === 0 ? (
        <p className="text-gray-500">Your cart is empty.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <section className="md:col-span-2 space-y-4" aria-label="Cart items">
            {cart.items.map((item: CartItem) => (
              <div
                key={item.id}
                className="flex justify-between items-center border-b pb-4"
              >
                <div>
                  <h2 className="font-semibold text-lg">{item.title}</h2>
                  <p className="text-gray-600">
                    ${Number(item.price).toFixed(2)} × {item.quantity}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => cart.removeItem(item.id)}
                  className="text-red-600 hover:underline text-sm"
                >
                  Remove
                </button>
              </div>
            ))}
          </section>

          <section className="bg-gray-50 p-6 rounded-lg border h-fit space-y-4">
            <h2 className="text-xl font-semibold">Order Summary</h2>
            <div className="flex justify-between text-lg font-bold">
              <span>Total:</span>
              <span>${totalPrice.toFixed(2)}</span>
            </div>

            {session?.user?.preferredPaymentMethod && (
              <p className="text-sm text-gray-600">
                Preferred payment: {session.user.preferredPaymentMethod === 'CASH' ? 'Cash on delivery' : 'Card'}
              </p>
            )}
            {status === 'unauthenticated' && (
              <p className="text-sm text-gray-600">
                <Link className="underline" href="/login">Sign in</Link> to continue to checkout.
              </p>
            )}
            {hasMixedStores && (
              <p role="alert" className="text-sm text-red-600">
                Checkout supports products from one store at a time.
              </p>
            )}
            {!storeId && (
              <p role="alert" className="text-sm text-red-600">
                Store information is missing for one or more cart items.
              </p>
            )}
            {error && <p role="alert" className="text-sm text-red-600">{error}</p>}

            <button
              type="button"
              disabled={!canCheckout}
              onClick={onCheckout}
              className="w-full bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50"
            >
              {loading
                ? 'Processing...'
                : session?.user?.preferredPaymentMethod === 'CASH'
                  ? 'Place cash-on-delivery order'
                  : 'Checkout with Stripe'}
            </button>
          </section>
        </div>
      )}
    </main>
  );
}
