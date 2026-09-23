import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";

const directory = dirname(fileURLToPath(import.meta.url));
const databasePath = join(directory, "..", "data", "freshbites.db");
mkdirSync(dirname(databasePath), { recursive: true });

export const db = new DatabaseSync(databasePath);

db.exec(`
  PRAGMA foreign_keys = ON;
  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    restaurant TEXT NOT NULL,
    price_cents INTEGER NOT NULL CHECK(price_cents >= 0),
    image TEXT NOT NULL
  ) STRICT;
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT NOT NULL,
    subtotal_cents INTEGER NOT NULL,
    delivery_cents INTEGER NOT NULL,
    tax_cents INTEGER NOT NULL,
    total_cents INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  ) STRICT;
  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL REFERENCES products(id),
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL CHECK(quantity > 0),
    price_cents INTEGER NOT NULL CHECK(price_cents >= 0)
  ) STRICT;
`);

const productCount = db.prepare("SELECT COUNT(*) AS count FROM products").get() as { count: number };
if (productCount.count === 0) {
  const insert = db.prepare("INSERT INTO products (id, name, description, restaurant, price_cents, image) VALUES (?, ?, ?, ?, ?, ?)");
  [
    ["burger", "Ultimate Burger Supreme", "Juicy beef patty, cheese & fresh veggies", "The Burger Spot", 1250, "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=640&q=85"],
    ["pizza", "Wood-Fired Margherita", "San Marzano tomatoes, mozzarella, basil", "Pizza Artisan", 1500, "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=640&q=85"],
    ["bowl", "All Things Fresh Bowl", "Seasonal greens, avocado & crunchy seeds", "Green Kitchen", 900, "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=640&q=85"]
  ].forEach((product) => insert.run(...product));
}
