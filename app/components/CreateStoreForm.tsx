'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createStoreAction } from '@/app/actions/stores';

export default function CreateStoreForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await createStoreAction(new FormData(event.currentTarget));
      if (!result.success) {
        setError(result.error);
        return;
      }

      router.push(`/dashboard/${encodeURIComponent(result.storeId)}`);
      router.refresh();
    } catch (submitError) {
      console.error('[CREATE_STORE_FORM]', submitError);
      setError('Could not create your store. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-5 rounded-xl border bg-white p-6 shadow-sm">
      <div>
        <label htmlFor="store-name" className="mb-1 block text-sm font-medium">
          Store name
        </label>
        <input
          id="store-name"
          name="name"
          required
          maxLength={100}
          className="w-full rounded-lg border px-3 py-2"
          placeholder="e.g. Hady Electronics"
        />
      </div>
      <div>
        <label htmlFor="store-description" className="mb-1 block text-sm font-medium">
          Description
        </label>
        <textarea
          id="store-description"
          name="description"
          maxLength={500}
          rows={4}
          className="w-full rounded-lg border px-3 py-2"
          placeholder="Tell customers about your store"
        />
      </div>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-black px-4 py-3 font-medium text-white disabled:opacity-50"
      >
        {loading ? 'Creating store...' : 'Create store'}
      </button>
    </form>
  );
}
