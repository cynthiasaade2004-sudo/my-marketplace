import crypto from "node:crypto";
import { cookies } from "next/headers";
import { query } from "@/lib/db";

const NAME = "session";
const secret = () => process.env.SESSION_SECRET || "dev-only-secret-change-me";
const sign = (v) =>
  crypto.createHmac("sha256", secret()).update(v).digest("hex");

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  return `${salt}:${crypto.scryptSync(password, salt, 64).toString("hex")}`;
}

export function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(":");
  const a = Buffer.from(hash, "hex");
  const b = crypto.scryptSync(password, salt, 64);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function startSession(supplierId) {
  (await cookies()).set(NAME, `${supplierId}.${sign(supplierId)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function endSession() {
  (await cookies()).delete(NAME);
}

export async function getSupplier() {
  const raw = (await cookies()).get(NAME)?.value;
  if (!raw) return null;
  const i = raw.lastIndexOf(".");
  const sid = raw.slice(0, i);
  const sig = Buffer.from(raw.slice(i + 1));
  const expected = Buffer.from(sign(sid));
  if (sig.length !== expected.length || !crypto.timingSafeEqual(sig, expected))
    return null;
  const s = query((db) => db.suppliers.find((x) => x.id === sid));
  return s ? { id: s.id, name: s.name, email: s.email } : null;
}
