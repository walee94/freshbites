import { placeOrder } from "./api";
import { changeQuantity, clearCart, countCart, getCart, removeFromCart, subtotal } from "./cart";
import { ensureCartStyles } from "./cart-styles";

const money = (value: number): string => `$${value.toFixed(2)}`;

export function renderCartPage(app: HTMLDivElement): void {
  ensureCartStyles();
  const items = getCart();
  const delivery = items.length ? 3.99 : 0;
  const tax = (subtotal() + delivery) * 0.086;
  const total = subtotal() + delivery + tax;
  const contents = items.length ? items.map(({ product, quantity }) => `<article class="cart-item"><img src="${product.image}" alt="${product.name}"><div class="cart-item-info"><h3>${product.name}</h3><p>${product.description}</p><div class="quantity"><button data-action="decrease" data-id="${product.id}" aria-label="Decrease ${product.name}">-</button><b>${quantity}</b><button data-action="increase" data-id="${product.id}" aria-label="Increase ${product.name}">+</button></div></div><div class="cart-item-price"><strong>${money(product.price * quantity)}</strong><button data-action="remove" data-id="${product.id}">Remove</button></div></article>`).join("") : `<div class="empty-cart"><span>🛍</span><h2>Your cart is empty</h2><p>Find something delicious and add it to your cart.</p><a href="#top">Browse food</a></div>`;
  app.innerHTML = `<header class="topbar container"><a class="brand" href="#top"><span>&#10023;</span>FreshBites</a><nav><a href="#top">Home</a><a href="#top">All Foods</a></nav><div class="actions"><button class="cart" type="button">Cart <b>${countCart()}</b></button><button class="avatar" aria-label="Account">A</button></div></header><main class="cart-page container"><div class="cart-page-title"><span class="eyebrow">Review & pay</span><h1>Your Food Cart</h1><p>🚚 Estimated delivery in 20-30 mins</p></div><div class="cart-layout"><section class="cart-list"><div class="restaurant-bar"><span>🍴</span><div><b>FreshBites selections</b><small>Delivered fresh to your door</small></div><em>Open</em></div>${contents}${items.length ? `<form class="promo-form"><span>◇</span><input name="promo" placeholder="Promo code (e.g. FRESH20)"><button>Apply</button></form>` : ""}</section><aside class="order-summary"><h2>Order Summary</h2><div><span>Subtotal</span><b>${money(subtotal())}</b></div><div><span>Delivery Fee</span><b>${money(delivery)}</b></div><div><span>Estimated Tax</span><b>${money(tax)}</b></div><div class="summary-total"><span>Total</span><strong>${money(total)}</strong></div><button class="checkout-button" ${items.length ? "" : "disabled"}>Proceed to Secure Checkout <span>→</span></button><small>▣ Encrypted & powered by Stripe Payments</small></aside></div><section class="delivery-note"><b>ⓘ Contactless Delivery</b><p>Your courier will leave your order at your door and ring the doorbell upon arrival.</p></section></main><footer><div class="container footer-grid"><div><a class="brand" href="#top"><span>&#10023;</span>FreshBites</a><p>Delivering fresh, chef-prepared meals straight to your door with lightning-fast delivery.</p></div><div><h3>Quick Links</h3><a href="#top">Home</a><a href="#cart">My Cart</a></div><div><h3>Support</h3><a href="#">Help Center</a><a href="#">Contact us</a></div><div><h3>Stay Connected</h3><p>Get updates on new restaurants and exclusive offers.</p></div></div><small class="copyright">&copy; 2024 FreshBites Inc. All rights reserved.</small></footer>`;
  app.querySelectorAll<HTMLButtonElement>("[data-action]").forEach((button) => button.addEventListener("click", () => {
    const id = button.dataset.id;
    if (!id) return;
    if (button.dataset.action === "increase") changeQuantity(id, 1);
    if (button.dataset.action === "decrease") changeQuantity(id, -1);
    if (button.dataset.action === "remove") removeFromCart(id);
    renderCartPage(app);
  }));
  app.querySelector<HTMLButtonElement>(".checkout-button")?.addEventListener("click", () => showCheckoutForm(app));
}

function showCheckoutForm(app: HTMLDivElement): void {
  const summary = app.querySelector<HTMLElement>(".order-summary");
  if (!summary) return;
  summary.innerHTML = `<h2>Checkout details</h2><form class="checkout-form"><label>Full name<input required name="customerName" placeholder="Your name"></label><label>Phone number<input required name="phone" placeholder="01XXXXXXXXX"></label><label>Delivery address<textarea required name="address" placeholder="House, road, area, city"></textarea></label><p class="form-status" aria-live="polite"></p><button class="checkout-button" type="submit">Place order <span>→</span></button></form>`;
  const form = summary.querySelector<HTMLFormElement>(".checkout-form");
  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submit = form.querySelector<HTMLButtonElement>("button[type=submit]");
    const status = form.querySelector<HTMLElement>(".form-status");
    const fields = new FormData(form);
    if (submit) { submit.disabled = true; submit.textContent = "Placing order..."; }
    try {
      const order = await placeOrder({ customerName: String(fields.get("customerName") ?? ""), phone: String(fields.get("phone") ?? ""), address: String(fields.get("address") ?? "") }, getCart());
      clearCart();
      summary.innerHTML = `<div class="order-success"><span>✓</span><h2>Order placed!</h2><p>Thanks for your order. Your confirmation number is <b>#${order.orderId}</b>.</p><strong>${money(order.total)}</strong></div>`;
      const list = app.querySelector<HTMLElement>(".cart-list");
      if (list) list.innerHTML = `<div class="empty-cart"><span>🎉</span><h2>We're preparing your food</h2><p>Your order has been sent to the restaurant.</p><a href="#top">Order more food</a></div>`;
      const badge = app.querySelector(".cart b");
      if (badge) badge.textContent = "0";
    } catch (error) {
      if (status) status.textContent = error instanceof Error ? error.message : "Unable to place your order.";
      if (submit) { submit.disabled = false; submit.innerHTML = "Place order <span>→</span>"; }
    }
  });
}
