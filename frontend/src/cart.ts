import { productById } from "./products";
import type { CartItem, Product } from "./types";

const storageKey = "freshbites-cart";

function load(): CartItem[] {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return [];
    const saved = JSON.parse(raw) as Array<{ productId: string; quantity: number }>;
    return saved.flatMap(({ productId, quantity }) => {
      const product = productById(productId);
      return product && quantity > 0 ? [{ product, quantity }] : [];
    });
  } catch { return []; }
}

let items: CartItem[] = load();

function save(): void {
  localStorage.setItem(storageKey, JSON.stringify(items.map(({ product, quantity }) => ({ productId: product.id, quantity }))));
}

export function getCart(): CartItem[] { return items; }
export function countCart(): number { return items.reduce((total, item) => total + item.quantity, 0); }
export function subtotal(): number { return items.reduce((total, item) => total + item.product.price * item.quantity, 0); }
export function addToCart(product: Product): void {
  const current = items.find((item) => item.product.id === product.id);
  if (current) current.quantity += 1;
  else items = [...items, { product, quantity: 1 }];
  save();
}
export function changeQuantity(productId: string, difference: number): void {
  const current = items.find((item) => item.product.id === productId);
  if (!current) return;
  current.quantity += difference;
  items = items.filter((item) => item.quantity > 0);
  save();
}
export function removeFromCart(productId: string): void {
  items = items.filter((item) => item.product.id !== productId);
  save();
}
export function clearCart(): void { items = []; save(); }
