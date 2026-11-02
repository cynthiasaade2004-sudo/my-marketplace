import { Suspense } from 'react';
import Link from 'next/link';
import { connection } from 'next/server';
import { auth } from '@/auth';
import CreateStoreForm from '@/app/components/CreateStoreForm';

async function StoreContent() {
  await connection();
  const session = await auth();

  if (!session?.user?.id) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="mb-4 text-3xl font-bold">Start selling</h1>
        <p className="mb-6 text-gray-600">
          Sign in or create an account before opening your supplier store.
        </p>
        <div className="flex gap-4">
          <Link href="/login" className="rounded-lg bg-black px-5 py-3 text-white">
            Sign in or sign up
          </Link>
          <Link href="/" className="rounded-lg border px-5 py-3">
            Continue browsing
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="mb-3 text-3xl font-bold">Create your supplier store</h1>
      <p className="mb-8 text-gray-600">
        Set up your store, then add products from its dashboard.
      </p>
      <CreateStoreForm />
    </main>
  );
}

export default function NewStorePage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-3xl px-4 py-16 text-gray-500">
          Loading store setup...
        </main>
      }
    >
      <StoreContent />
    </Suspense>
  );
}
