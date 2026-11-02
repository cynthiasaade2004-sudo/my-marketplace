import Link from "next/link";
import { redirect } from "next/navigation";
import SimpleForm from "@/app/SimpleForm";
import { addProduct, deleteProduct, deleteShop } from "@/app/actions";
import { query } from "@/lib/db";
import { getSupplier } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function Page() {
  const supplier = await getSupplier();
  if (!supplier) redirect("/login");
  const shops = query((db) =>
    db.shops.filter((s) => s.supplierId === supplier.id).map((s) => ({
      ...s, products: db.products.filter((p) => p.shopId === s.id),
    })),
  );
  return (
    <>
      <h1>Welcome, {supplier.name}</h1>
      <p><Link href="/dashboard/shops/new">+ New shop</Link></p>
      {shops.length === 0 && <p>You have no shops yet.</p>}
      {shops.map((shop) => (
        <section key={shop.id} className="card" style={{ marginBottom: "1rem" }}>
          <h2><Link href={`/shops/${shop.id}`}>{shop.name}</Link></h2>
          <p>{shop.description}</p>
          <ul>
            {shop.products.map((p) => (
              <li key={p.id}>
                {p.name} — ${p.price.toFixed(2)}
                <form action={deleteProduct} style={{ display: "inline" }}>
                  <input type="hidden" name="productId" value={p.id} />
                  <button>Remove</button>
                </form>
              </li>
            ))}
          </ul>
          <h3>Add product</h3>
          <SimpleForm action={addProduct} submit="Add product" hidden={{ shopId: shop.id }} fields={[
            { name: "name", label: "Product name", required: true },
            { name: "price", label: "Price", type: "number", step: "0.01", min: "0", required: true },
            { name: "description", label: "Description", area: true },
          ]} />
          <form action={deleteShop}>
            <input type="hidden" name="shopId" value={shop.id} />
            <button>Delete shop</button>
          </form>
        </section>
      ))}
    </>
  );
}
