import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const FILE = path.join(process.cwd(), "data", "db.json");

function read() {
  try {
    return JSON.parse(fs.readFileSync(FILE, "utf8"));
  } catch {
    return { suppliers: [], shops: [], products: [] };
  }
}

function write(db) {
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(db, null, 2));
}

export const id = () => crypto.randomUUID();

export function query(fn) {
  return fn(read());
}

export function mutate(fn) {
  const db = read();
  const result = fn(db);
  write(db);
  return result;
}
