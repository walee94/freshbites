import cors from "cors";
import express from "express";
import { db } from "./database.js";

type ProductRow = { id: string; name: string; description: string; restaurant: string; price_cents: number; image: string };
type OrderedProduct = Pick<ProductRow, "id" | "name" | "price_cents">;
type OrderRequest = { customerName?: string; phone?: string; address?: string; items?: Array<{ productId?: string; quantity?: number }> };

const app = express();
const port = Number(process.env.PORT ?? 3001);
app.use(cors({ origin: ["http://localhost:5173", "http://127.0.0.1:5173"] }));
app.use(express.json());

app.get("/api/health", (_request, response) => response.json({ ok: true }));
app.get("/api/products", (_request, response) => {
  const rows = db.prepare("SELECT id, name, description, restaurant, price_cents, image FROM products ORDER BY rowid").all() as ProductRow[];
  response.json(rows.map(({ price_cents, ...product }) => ({ ...product, price: price_cents / 100 })));
});

app.post("/api/orders", (request, response) => {
  const { customerName, phone, address, items } = request.body as OrderRequest;
  if (!customerName?.trim() || !phone?.trim() || !address?.trim() || !Array.isArray(items) || items.length === 0) return response.status(400).json({ success: false, message: "Name, phone, address, and at least one cart item are required." });
  const requested = items.map((item) => ({ productId: item.productId ?? "", quantity: Number(item.quantity) }));
  if (requested.some((item) => !item.productId || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 50)) return response.status(400).json({ success: false, message: "Each order item must have a valid product and quantity." });
  const selected = requested.map((item) => ({ item, product: db.prepare("SELECT id, name, price_cents FROM products WHERE id = ?").get(item.productId) as OrderedProduct | undefined }));
  if (selected.some((entry) => !entry.product)) return response.status(400).json({ success: false, message: "One or more products are unavailable." });
  const orderLines = selected as Array<{ item: { productId: string; quantity: number }; product: OrderedProduct }>;
  const subtotalCents = orderLines.reduce((sum, { item, product }) => sum + product.price_cents * item.quantity, 0);
  const deliveryCents = 399;
  const taxCents = Math.round((subtotalCents + deliveryCents) * 0.086);
  const totalCents = subtotalCents + deliveryCents + taxCents;
  try {
    db.exec("BEGIN");
    const result = db.prepare("INSERT INTO orders (customer_name, phone, address, subtotal_cents, delivery_cents, tax_cents, total_cents) VALUES (?, ?, ?, ?, ?, ?, ?)").run(customerName.trim(), phone.trim(), address.trim(), subtotalCents, deliveryCents, taxCents, totalCents);
    const orderId = Number(result.lastInsertRowid);
    const insertItem = db.prepare("INSERT INTO order_items (order_id, product_id, product_name, quantity, price_cents) VALUES (?, ?, ?, ?, ?)");
    orderLines.forEach(({ item, product }) => insertItem.run(orderId, product.id, product.name, item.quantity, product.price_cents));
    db.exec("COMMIT");
    return response.status(201).json({ success: true, orderId, total: totalCents / 100 });
  } catch (error) {
    db.exec("ROLLBACK");
    console.error(error);
    return response.status(500).json({ success: false, message: "Unable to place the order." });
  }
});

app.listen(port, () => console.log(`FreshBites API listening at http://localhost:${port}`));
