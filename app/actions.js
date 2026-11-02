"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { id, mutate, query } from "@/lib/db";
import {
  endSession, getSupplier, hashPassword, startSession, verifyPassword,
} from "@/lib/session";

const str = (fd, k, max = 500) => String(fd.get(k) ?? "").trim().slice(0, max);

export async function signup(_prev, fd) {
  const name = str(fd, "name", 100);
  const email = str(fd, "email", 200).toLowerCase();
  const password = String(fd.get("password") ?? "");
  if (!name || !/^\S+@\S+\.\S+$/.test(email))
    return { error: "Name and a valid email are required." };
  if (password.length < 8)
    return { error: "Password must be at least 8 characters." };
  const supplier = mutate((db) => {
    if (db.suppliers.some((s) => s.email === email)) return null;
    const s = { id: id(), name, email, password: hashPassword(password) };
    db.suppliers.push(s);
    return s;
  });
  if (!supplier) return { error: "Email already registered." };
  await startSession(supplier.id);
  redirect("/dashboard");
}

export async function login(_prev, fd) {
  const email = str(fd, "email", 200).toLowerCase();
  const password = String(fd.get("password") ?? "");
  const s = query((db) => db.suppliers.find((x) => x.email === email));
  if (!s || !verifyPassword(password, s.password))
    return { error: "Invalid email or password." };
  await startSession(s.id);
  redirect("/dashboard");
}

export async function logout() {
  await endSession();
  redirect("/");
}

async function requireSupplier() {
  const s = await getSupplier();
  if (!s) redirect("/login");
  return s;
}

export async function createShop(_prev, fd) {
  const s = await requireSupplier();
  const name = str(fd, "name", 100);
  if (!name) return { error: "Shop name is required." };
  mutate((db) =>
    db.shops.push({
      id: id(), supplierId: s.id, name,
      description: str(fd, "description", 1000), createdAt: Date.now(),
    }),
  );
  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function deleteShop(fd) {
  const s = await requireSupplier();
  const shopId = str(fd, "shopId");
  mutate((db) => {
    const shop = db.shops.find((x) => x.id === shopId && x.supplierId === s.id);
    if (!shop) return;
    db.shops = db.shops.filter((x) => x !== shop);
    db.products = db.products.filter((p) => p.shopId !== shopId);
  });
  revalidatePath("/", "layout");
}

export async function addProduct(_prev, fd) {
  const s = await requireSupplier();
  const shopId = str(fd, "shopId");
  const name = str(fd, "name", 100);
  const price = Number(fd.get("price"));
  if (!name || !Number.isFinite(price) || price < 0)
    return { error: "Name and a valid price are required." };
  const ok = mutate((db) => {
    if (!db.shops.some((x) => x.id === shopId && x.supplierId === s.id))
      return false;
    db.products.push({
      id: id(), shopId, name, price,
      description: str(fd, "description", 1000),
    });
    return true;
  });
  if (!ok) return { error: "Shop not found." };
  revalidatePath("/", "layout");
  return { error: null, ok: true };
}

export async function deleteProduct(fd) {
  const s = await requireSupplier();
  const productId = str(fd, "productId");
  mutate((db) => {
    const p = db.products.find((x) => x.id === productId);
    if (p && db.shops.some((x) => x.id === p.shopId && x.supplierId === s.id))
      db.products = db.products.filter((x) => x !== p);
  });
  revalidatePath("/", "layout");
}
