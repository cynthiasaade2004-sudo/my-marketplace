import { notFound } from "next/navigation";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function Page({ params }) {
  const { id } = await params;
  const data = query((db) => {
    const shop = db.shops.find((s) => s.id === id);
    return shop && { shop, products: db.products.filter((p) => p.shopId === id) };
  });
  if (!data) notFound();
  return (
    <>
      <h1>{data.shop.name}</h1>
      <p>{data.shop.description}</p>
      <div className="grid">
        {data.products.map((p) => (
          <div key={p.id} className="card">
            <strong>{p.name}</strong> — ${p.price.toFixed(2)}
            <p>{p.description}</p>
          </div>
        ))}
      </div>
      {!data.products.length && <p>No products yet.</p>}
    </>
  );
}
