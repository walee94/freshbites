import "dotenv/config";
import cors from "cors";
import express from "express";
import { initializeDatabase, pool, withTransaction } from "./database.js";

type ProductRow = { id: string; name: string; description: string; restaurant: string; price_cents: number; image: string };
type OrderedProduct = Pick<ProductRow, "id" | "name" | "price_cents">;
type OrderRequest = { customerName?: string; phone?: string; address?: string; items?: Array<{ productId?: string; quantity?: number }> };

const app = express();
const port = Number(process.env.PORT ?? 3001);
const allowedOrigins = new Set([
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  ...(process.env.FRONTEND_URL ?? "").split(",").map((origin) => origin.trim()).filter(Boolean)
]);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) return callback(null, true);
    return callback(new Error(`Origin ${origin} is not allowed by CORS`));
  }
}));
app.use(express.json({ limit: "100kb" }));

app.get("/", (_request, response) => {
  response.json({ name: "FreshBites API", status: "running", endpoints: ["GET /api/health", "GET /api/products", "POST /api/orders"] });
});

app.get("/api/health", async (_request, response) => {
  await pool.query("SELECT 1");
  response.json({ ok: true, database: "connected" });
});

app.get("/api/products", async (_request, response) => {
  const result = await pool.query<ProductRow>("SELECT id, name, description, restaurant, price_cents, image FROM products ORDER BY id");
  response.json(result.rows.map(({ price_cents, ...product }) => ({ ...product, price: price_cents / 100 })));
});

app.post("/api/orders", async (request, response) => {
  const { customerName, phone, address, items } = request.body as OrderRequest;
  if (!customerName?.trim() || !phone?.trim() || !address?.trim() || !Array.isArray(items) || items.length === 0) {
    return response.status(400).json({ success: false, message: "Name, phone, address, and at least one cart item are required." });
  }

  const requested = items.map((item) => ({ productId: item.productId ?? "", quantity: Number(item.quantity) }));
  if (requested.some((item) => !item.productId || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 50)) {
    return response.status(400).json({ success: false, message: "Each order item must have a valid product and quantity." });
  }

  const productIds = [...new Set(requested.map((item) => item.productId))];
  const productResult = await pool.query<OrderedProduct>("SELECT id, name, price_cents FROM products WHERE id = ANY($1::text[])", [productIds]);
  const productMap = new Map(productResult.rows.map((product) => [product.id, product]));
  if (requested.some((item) => !productMap.has(item.productId))) {
    return response.status(400).json({ success: false, message: "One or more products are unavailable." });
  }

  const orderLines = requested.map((item) => ({ item, product: productMap.get(item.productId)! }));
  const subtotalCents = orderLines.reduce((sum, { item, product }) => sum + product.price_cents * item.quantity, 0);
  const deliveryCents = 399;
  const taxCents = Math.round((subtotalCents + deliveryCents) * 0.086);
  const totalCents = subtotalCents + deliveryCents + taxCents;

  try {
    const orderId = await withTransaction(async (client) => {
      const orderResult = await client.query<{ id: string }>(
        `INSERT INTO orders (customer_name, phone, address, subtotal_cents, delivery_cents, tax_cents, total_cents)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
        [customerName.trim(), phone.trim(), address.trim(), subtotalCents, deliveryCents, taxCents, totalCents]
      );
      const id = orderResult.rows[0].id;
      for (const { item, product } of orderLines) {
        await client.query(
          `INSERT INTO order_items (order_id, product_id, product_name, quantity, price_cents)
           VALUES ($1, $2, $3, $4, $5)`,
          [id, product.id, product.name, item.quantity, product.price_cents]
        );
      }
      return id;
    });
    return response.status(201).json({ success: true, orderId: Number(orderId), total: totalCents / 100 });
  } catch (error) {
    console.error("Unable to place order", error);
    return response.status(500).json({ success: false, message: "Unable to place the order." });
  }
});

app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
  console.error(error);
  response.status(500).json({ success: false, message: "Unexpected server error." });
});

async function start(): Promise<void> {
  await initializeDatabase();
  app.listen(port, () => console.log(`FreshBites API listening on port ${port}`));
}

start().catch((error) => {
  console.error("FreshBites API failed to start", error);
  process.exit(1);
});
