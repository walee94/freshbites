import type { CartItem } from "./types";

const apiBaseUrl = (import.meta.env.VITE_API_URL ?? "http://localhost:3001").replace(/\/$/, "");

export async function placeOrder(customer: { customerName: string; phone: string; address: string }, items: CartItem[]): Promise<{ orderId: number; total: number }> {
  const response = await fetch(`${apiBaseUrl}/api/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...customer, items: items.map(({ product, quantity }) => ({ productId: product.id, quantity })) })
  });
  const data = await response.json() as { success: boolean; message?: string; orderId?: number; total?: number };
  if (!response.ok || !data.success || !data.orderId || data.total === undefined) throw new Error(data.message ?? "Unable to place your order.");
  return { orderId: data.orderId, total: data.total };
}
