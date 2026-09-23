import type { Product } from "./types";

export const products: Product[] = [
  { id: "burger", restaurant: "The Burger Spot", name: "Ultimate Burger Supreme", description: "Juicy beef patty, cheese & fresh veggies", price: 12.5, image: "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=640&q=85" },
  { id: "pizza", restaurant: "Pizza Artisan", name: "Wood-Fired Margherita", description: "San Marzano tomatoes, mozzarella, basil", price: 15, image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=640&q=85" },
  { id: "bowl", restaurant: "Green Kitchen", name: "All Things Fresh Bowl", description: "Seasonal greens, avocado & crunchy seeds", price: 9, image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=640&q=85" }
];

export const productById = (id: string): Product | undefined => products.find((product) => product.id === id);
