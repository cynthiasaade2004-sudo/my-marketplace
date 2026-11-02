import { Suspense } from 'react';
import { connection } from 'next/server';
import Link from 'next/link';
import { getMarketplaceProducts } from '@/app/actions/products';
import ProductGrid from '@/app/components/ProductGrid';

async function ProductList() {
  await connection();
  const { success, products } = await getMarketplaceProducts();

  if (!success || products.length === 0) {
    return <p className="text-gray-500">No products available yet.</p>;
  }

  return (
    <ProductGrid
      products={products.map((product) => ({
        ...product,
        price: String(product.price),
      }))}
    />
  );
}

export default function HomePage() {
  return (
    <main className="mx-auto max-w-6xl p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">Welcome to Marketplace</h1>
        <Link
          href="/stores/new"
          className="rounded-lg border border-black px-4 py-2 font-medium hover:bg-gray-100"
        >
          Start selling
        </Link>
      </div>
      <Suspense fallback={<p className="py-10 text-center">Loading products...</p>}>
        <ProductList />
      </Suspense>
    </main>
  );
}
