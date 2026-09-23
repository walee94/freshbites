import "dotenv/config";
import { Pool, type PoolClient } from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required. Copy backend/.env.example to backend/.env and add your PostgreSQL connection string.");
}

export const pool = new Pool({ connectionString });

export async function initializeDatabase(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      restaurant TEXT NOT NULL,
      price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
      image TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS orders (
      id BIGSERIAL PRIMARY KEY,
      customer_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      address TEXT NOT NULL,
      subtotal_cents INTEGER NOT NULL,
      delivery_cents INTEGER NOT NULL,
      tax_cents INTEGER NOT NULL,
      total_cents INTEGER NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id BIGSERIAL PRIMARY KEY,
      order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id TEXT NOT NULL REFERENCES products(id),
      product_name TEXT NOT NULL,
      quantity INTEGER NOT NULL CHECK (quantity > 0),
      price_cents INTEGER NOT NULL CHECK (price_cents >= 0)
    );
  `);

  const products = [
    ["burger", "Ultimate Burger Supreme", "Juicy beef patty, cheese & fresh veggies", "The Burger Spot", 1250, "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=640&q=85"],
    ["pizza", "Wood-Fired Margherita", "San Marzano tomatoes, mozzarella, basil", "Pizza Artisan", 1500, "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=640&q=85"],
    ["bowl", "All Things Fresh Bowl", "Seasonal greens, avocado & crunchy seeds", "Green Kitchen", 900, "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=640&q=85"]
  ] as const;

  for (const product of products) {
    await pool.query(
      `INSERT INTO products (id, name, description, restaurant, price_cents, image)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO NOTHING`,
      [...product]
    );
  }
}

export async function withTransaction<T>(work: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await work(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
