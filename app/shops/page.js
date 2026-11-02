import { query } from "@/lib/db";
import { ShopGrid } from "@/app/page";

export const dynamic = "force-dynamic";

export default async function Page({ searchParams }) {
  const q = String((await searchParams).q ?? "").trim().toLowerCase();
  const shops = query((db) =>
    db.shops.filter((s) =>
      !q || `${s.name} ${s.description}`.toLowerCase().includes(q) ||
      db.products.some((p) => p.shopId === s.id && p.name.toLowerCase().includes(q))),
  );
  return (
    <>
      <h1>Shops</h1>
      <form action="/shops" style={{ display: "flex" }}>
        <input name="q" defaultValue={q} placeholder="Search shops or products" />
        <button>Search</button>
      </form>
      <ShopGrid shops={shops} />
    </>
  );
}
