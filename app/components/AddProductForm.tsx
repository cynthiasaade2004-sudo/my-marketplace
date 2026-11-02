'use client';

import { createProductAction } from "@/app/actions/products";
import { useState } from "react";

export default function AddProductForm({ storeId }: { storeId: string }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ success?: boolean; text?: string } | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const form = event.currentTarget;
      const formData = new FormData(form);
      formData.append("storeId", storeId);

      const result = await createProductAction(formData);
      if (result.success) {
        setMessage({ success: true, text: "Product successfully listed on your store!" });
        form.reset();
      } else {
        setMessage({ success: false, text: result.error || "Something went wrong." });
      }
    } catch (error) {
      console.error("[ADD_PRODUCT_FORM]", error);
      setMessage({ success: false, text: "Could not add product. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-zinc-900 border border-black/[.08] dark:border-white/[.145] p-6 rounded-xl shadow-sm max-w-xl mx-auto space-y-4">
      <h2 className="text-xl font-bold tracking-tight">Add New Product to Store</h2>

      {message && (
        <div className={`p-3 rounded-lg text-sm ${message.success ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
          {message.text}
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider mb-1">Product Title</label>
        <input 
          name="title" 
          required 
          placeholder="e.g. Handmade Leather Wallet" 
          className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-800 dark:border-zinc-700 text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white" 
        />
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider mb-1">Description</label>
        <textarea 
          name="description" 
          rows={3} 
          placeholder="Describe your item..." 
          className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-800 dark:border-zinc-700 text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white" 
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-1">Price ($)</label>
          <input 
            name="price" 
            type="number" 
            step="0.01" 
            required 
            placeholder="29.99" 
            className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-800 dark:border-zinc-700 text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white" 
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-1">Initial Stock</label>
          <input 
            name="stock" 
            type="number" 
            required 
            defaultValue="10" 
            className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-800 dark:border-zinc-700 text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white" 
          />
        </div>
      </div>

      <button 
        type="submit" 
        disabled={loading}
        className="w-full py-2.5 bg-black text-white dark:bg-white dark:text-black font-medium rounded-lg text-sm hover:opacity-80 transition-opacity disabled:opacity-50"
      >
        {loading ? "Listing Product..." : "Publish Product"}
      </button>
    </form>
  );
}