import { Suspense } from "react";
import { getSellerDashboardData } from "@/app/actions/products";
import AddProductForm from "@/app/components/AddProductForm";
import { connection } from "next/server";

async function DashboardContent({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;
  await connection(); // Moved inside the Suspense boundary
  const { success, store, products, error } = await getSellerDashboardData(storeId);

  if (!success || !store) {
    return <div className="p-6 text-red-500">{error || "Store not found"}</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">{store.name}</h1>
      <p className="text-gray-600 mb-6">{store.description}</p>

      <div className="mb-8">
        <AddProductForm storeId={store.id} />
      </div>

      <h2 className="text-xl font-semibold mb-4">Store Inventory</h2>
      <div className="grid gap-4">
        {products.map((product: any) => (
          <div key={product.id} className="border p-4 rounded shadow-sm">
            <h3 className="font-bold">{product.title}</h3>
            <p className="text-sm text-gray-500">{product.description}</p>
            <p className="mt-2 font-semibold">${product.price} (Stock: {product.stock})</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading dashboard...</div>}>
      <DashboardContent params={params} />
    </Suspense>
  );
}