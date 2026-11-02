import Link from "next/link";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export default function Home() {
  const shops = query((db) => db.shops.slice(-6).reverse());
  return (
    <>
      <h1>Discover independent shops</h1>
      <p>Browse products from independent suppliers. Selling? <Link href="/signup">Open your shop</Link>.</p>
      <h2>Newest shops</h2>
      <ShopGrid shops={shops} />
      <p><Link href="/shops">See all shops →</Link></p>
    </>
  );
}

export function ShopGrid({ shops }) {
  if (!shops.length) return <p>No shops yet.</p>;
  return (
    <div className="grid">
      {shops.map((s) => (
        <Link key={s.id} href={`/shops/${s.id}`} className="card">
          <strong>{s.name}</strong>
          <p>{s.description}</p>
        </Link>
      ))}
    </div>
  );
}
