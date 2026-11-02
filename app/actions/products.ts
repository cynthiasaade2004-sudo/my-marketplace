'use server';

import { auth } from '@/auth';
import { db } from "@/src/prisma/db";
import { revalidatePath } from "next/cache";

export async function getMarketplaceProducts() {
  try {
    const runtime = db.runtime();
    const queryPlan = db.sql.public.Product
      .select("id", "title", "slug", "description", "price", "stock", "storeId")
      .build();

    const products = await runtime.query(queryPlan);
    return { success: true, products };
  } catch (error) {
    console.error("Error fetching marketplace products:", error);
    return { success: false, products: [], error: "Failed to load products" };
  }
}

export async function createProductAction(formData: FormData) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return { success: false, error: "Sign in to add products to your store." };
    }

    const titleEntry = formData.get("title");
    const descriptionEntry = formData.get("description");
    const priceEntry = formData.get("price");
    const stockEntry = formData.get("stock");
    const storeIdEntry = formData.get("storeId");

    if (
      typeof titleEntry !== "string" ||
      typeof descriptionEntry !== "string" ||
      typeof priceEntry !== "string" ||
      typeof stockEntry !== "string" ||
      typeof storeIdEntry !== "string"
    ) {
      return { success: false, error: "Missing required fields." };
    }

    const title = titleEntry.trim();
    const description = descriptionEntry.trim();
    const storeId = storeIdEntry.trim();
    const priceValue = priceEntry.trim();
    const price = Number(priceValue);
    const stock = Number(stockEntry);

    if (
      !title ||
      !storeId ||
      !/^(?:\d+\.?\d*|\.\d+)$/.test(priceValue) ||
      !Number.isFinite(price) ||
      price <= 0 ||
      !Number.isInteger(stock) ||
      stock < 0
    ) {
      return { success: false, error: "Enter a valid title, price, stock, and store." };
    }

    const store = await db.orm.public.Store
      .select("id")
      .where({ id: storeId, userId })
      .first();
    if (!store) {
      return { success: false, error: "You can only add products to your own store." };
    }

    const slug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`;
    const runtime = db.runtime();

    const insertPlan = db.sql.public.Product
      .insert([{
        title,
        slug,
        description: description || "",
        price: priceValue,
        stock,
        images: [],
        storeId,
      }])
      .returning("id")
      .build();

    await runtime.query(insertPlan);
    revalidatePath(`/dashboard/${storeId}`);
    revalidatePath("/");

    return { success: true };
  } catch (error) {
    console.error("Error creating product:", error);
    return { success: false, error: "Failed to create product in database." };
  }
}

export async function getSellerDashboardData(storeId: string) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return { success: false, error: "Sign in to view this dashboard.", store: null, products: [] };
    }

    const runtime = db.runtime();

    const store = await db.orm.public.Store
      .select("id", "name", "slug", "description", "createdAt")
      .where({ id: storeId, userId })
      .first();

    if (!store) {
      return { success: false, error: "Store not found or you do not have access.", store: null, products: [] };
    }

    const productsPlan = db.sql.public.Product
      .select("id", "title", "description", "price", "stock", "createdAt")
      .where((fields, fns) => fns.eq(fields.storeId, storeId))
      .build();

    const products = await runtime.query(productsPlan);

    return { success: true, store, products };
  } catch (error) {
    console.error("Error fetching seller dashboard:", error);
    return { success: false, error: "Failed to load dashboard data", store: null, products: [] };
  }
}