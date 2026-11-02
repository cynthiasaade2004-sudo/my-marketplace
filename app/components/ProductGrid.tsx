'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useCart } from '@/src/hooks/use-cart';

type Product = {
  id: string;
  title: string;
  description: string;
  price: string;
  storeId: string;
};

export default function ProductGrid({ products }: { products: Product[] }) {
  const cart = useCart();
  const { status } = useSession();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
      {products.map((product) => (
        <article
          key={product.id}
          className="border p-4 rounded-lg hover:shadow-md transition"
        >
          <h2 className="text-lg font-bold">{product.title}</h2>
          <p className="text-sm text-gray-600 mt-1">{product.description}</p>
          <p className="mt-4 font-semibold text-green-600">${product.price}</p>
          {status === 'authenticated' ? (
            <button
              type="button"
              onClick={() => {
                cart.addItem({
                  id: product.id,
                  title: product.title,
                  price: product.price,
                  storeId: product.storeId,
                  quantity: 1,
                });
              }}
              className="mt-4 w-full rounded-lg bg-black px-4 py-2 text-white hover:bg-gray-800"
            >
              Add to cart
            </button>
          ) : status === 'unauthenticated' ? (
            <Link
              href="/login"
              className="mt-4 block w-full rounded-lg border border-black px-4 py-2 text-center font-medium hover:bg-gray-100"
            >
              Sign up to add to cart
            </Link>
          ) : (
            <button
              type="button"
              disabled
              className="mt-4 w-full rounded-lg bg-gray-300 px-4 py-2 text-gray-600"
            >
              Checking account...
            </button>
          )}
        </article>
      ))}
    </div>
  );
}
