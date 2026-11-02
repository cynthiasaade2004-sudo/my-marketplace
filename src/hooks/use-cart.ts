'use client';

import { useSyncExternalStore } from 'react';

export type CartItem = {
  id: string;
  title: string;
  price: number | string;
  quantity: number;
  storeId?: string;
};

const CART_STORAGE_KEY = 'marketplace-cart';
const listeners = new Set<() => void>();
const emptyCart: CartItem[] = [];
let cartItems: CartItem[] = [];
let initialized = false;

function notify() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  if (!initialized && typeof window !== 'undefined') {
    try {
      const storedCart: unknown = JSON.parse(
        window.localStorage.getItem(CART_STORAGE_KEY) ?? '[]'
      );
      cartItems = Array.isArray(storedCart)
        ? storedCart.filter(
            (item): item is CartItem =>
              item !== null &&
              typeof item === 'object' &&
              typeof item.id === 'string' &&
              typeof item.title === 'string' &&
              (typeof item.price === 'number' || typeof item.price === 'string') &&
              typeof item.quantity === 'number' &&
              Number.isSafeInteger(item.quantity) &&
              item.quantity > 0
          )
        : [];
    } catch {
      cartItems = [];
    }
    initialized = true;
  }

  return cartItems;
}

function getServerSnapshot() {
  return emptyCart;
}

function saveItems(nextItems: CartItem[]) {
  cartItems = nextItems;
  initialized = true;
  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
  notify();
}

function addItem(item: CartItem) {
  const quantityToAdd = Math.max(1, item.quantity || 1);
  const existingItemIndex = cartItems.findIndex((currentItem) => currentItem.id === item.id);

  if (existingItemIndex === -1) {
    saveItems([...cartItems, { ...item, quantity: quantityToAdd }]);
    return;
  }

  const updatedItems = [...cartItems];
  updatedItems[existingItemIndex] = {
    ...updatedItems[existingItemIndex],
    ...item,
    quantity: updatedItems[existingItemIndex].quantity + quantityToAdd,
  };
  saveItems(updatedItems);
}

function removeItem(id: string) {
  saveItems(cartItems.filter((item) => item.id !== id));
}

function removeAll() {
  saveItems([]);
}

export function useCart() {
  const items = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return { items, addItem, removeItem, removeAll };
}
