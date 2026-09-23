// @ts-ignore CSS is resolved by the bundler at runtime.
import "./styles.css";
import { addToCart, countCart } from "./cart";
import { renderCartPage } from "./cart-page";
import { productById } from "./products";

const root = document.querySelector<HTMLDivElement>("#app");
if (!root) throw new Error("App root is missing");
const app: HTMLDivElement = root;

const foodCard = (id: string, time: string, rating: string): string => {
  const product = productById(id);
  if (!product) return "";
  return `<article class="food-card"><div class="food-photo"><img src="${product.image}" alt="${product.name}"><span>${time}</span><button aria-label="Save ${product.name}">&#9825;</button></div><div class="food-info"><small>${product.restaurant}</small><h3>${product.name}</h3><p>${product.description}</p><div class="rating">&#9733; ${rating} <i>&bull;</i> Free delivery</div><div class="price-row"><b>$${product.price.toFixed(2)}</b><button class="add-button" data-product-id="${product.id}">+ Add to cart</button></div></div></article>`;
};

function renderHome(): void {
  app.innerHTML = `<header class="topbar container"><a class="brand" href="#top"><span>&#10023;</span>FreshBites</a><nav><a class="active" href="#top">Home</a><a href="#featured">All Foods</a><a href="#featured">Categories</a></nav><div class="actions"><button class="icon" aria-label="Search">&#8981;</button><button class="cart" type="button">Cart <b>${countCart()}</b></button><button class="avatar" aria-label="Account">A</button></div></header><main id="top"><section class="hero container"><div class="hero-copy"><span class="eyebrow"><i></i>Fresh & flavorful for everyone</span><h1>Fresh cravings,<br><em>delivered</em> hot to your door.</h1><p>Discover delicious meals from local restaurants and enjoy fast, reliable delivery whenever hunger strikes.</p><form class="delivery-search"><span>&#8982;</span><label class="sr-only" for="location">Delivery location</label><input id="location" placeholder="Enter your delivery location..."><button>Explore food <b>&rarr;</b></button></form></div><div class="hero-image"><img src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=780&q=85" alt="Burger, fries, and a drink"><span class="place">&#8982; Delivering to you</span><div class="restaurant-chip"><img src="https://images.unsplash.com/photo-1571091718767-18b5b1457add?auto=format&fit=crop&w=100&q=80" alt=""><div><b>The Burger Joint</b><small>&#9733; 4.9 &middot; 20-30 min</small></div><strong>&hearts;</strong></div></div></section><section class="container categories"><div class="heading"><div><span class="eyebrow pale-text">Browse by taste</span><h2>What are you craving today?</h2></div><a href="#featured">View all &rarr;</a></div><div class="category-list"><a href="#featured"><span class="tile pink">&#127828;</span><b>Burgers</b></a><a href="#featured"><span class="tile yellow">&#127829;</span><b>Pizza</b></a><a href="#featured"><span class="tile green">&#129367;</span><b>Healthy</b></a><a href="#featured"><span class="tile violet">&#127790;</span><b>Mexican</b></a><a href="#featured"><span class="tile peach">&#127836;</span><b>Asian</b></a><a href="#featured"><span class="tile yellow">&#127856;</span><b>Desserts</b></a></div></section><section class="container featured" id="featured"><div class="heading"><div><span class="eyebrow pale-text">Hand-picked for you</span><h2>Featured Dishes</h2></div><div class="filters"><button class="selected">All</button><button>Popular</button><button>Healthy</button><button>New</button></div></div><div class="food-grid">${foodCard("burger", "20-30 min", "4.9 (240+)")}${foodCard("pizza", "25-35 min", "4.8 (180+)")}${foodCard("bowl", "15-25 min", "4.7 (96+)")}</div></section><section class="container how"><span class="eyebrow pale-text">How it works</span><h2>Order Delicious Food in 3 Easy Steps</h2><p>From craving to your door, it's that simple.</p><div class="steps"><article><b>1</b><span>&#8981;</span><h3>Choose your food</h3><p>Browse local restaurants and find what makes your mouth water.</p></article><article><b>2</b><span>&#9635;</span><h3>Fast & fresh delivery</h3><p>Your order is prepared with care and delivered right to you.</p></article><article><b>3</b><span>&#9633;</span><h3>Enjoy & repeat</h3><p>Enjoy every bite and discover your next favorite meal.</p></article></div></section><section class="container app-promo"><div><span class="eyebrow">The FreshBites app</span><h2>Take FreshBites Wherever<br>You Crave</h2><p>Order your favorite food, track every delivery, and get exclusive offers—anytime, anywhere.</p><ul><li>Save your favorite restaurants</li><li>Real-time delivery tracking</li><li>Exclusive app-only offers</li></ul><div class="stores"><a href="#">&#63743; <small>Download on the</small><b>App Store</b></a><a href="#">&#9654; <small>Get it on</small><b>Google Play</b></a></div></div><div class="phone"><small>FRESHBITES</small><h3>Good evening, Alex</h3><article><b>Order on its way!</b><span>Arriving in 12 minutes</span></article><article><b>Your favorite is here</b><span>Order again in seconds</span></article></div></section></main><footer><div class="container footer-grid"><div><a class="brand" href="#top"><span>&#10023;</span>FreshBites</a><p>Delivering fresh, chef-prepared meals straight to your door with lightning-fast delivery.</p></div><div><h3>Quick Links</h3><a href="#top">Home</a><a href="#featured">All Foods</a><a href="#cart">My Cart</a></div><div><h3>Support</h3><a href="#">Help Center</a><a href="#">Contact us</a><a href="#">Terms of Service</a></div><div><h3>Stay Connected</h3><p>Get updates on new restaurants and exclusive offers.</p></div></div><small class="copyright">&copy; 2024 FreshBites Inc. All rights reserved.</small></footer>`;
  app.querySelectorAll<HTMLButtonElement>(".add-button").forEach((button) => button.addEventListener("click", () => {
    const product = productById(button.dataset.productId ?? "");
    if (!product) return;
    addToCart(product);
    const badge = app.querySelector(".cart b");
    if (badge) badge.textContent = String(countCart());
    button.textContent = "Added";
    setTimeout(() => { button.textContent = "+ Add to cart"; }, 800);
  }));
  app.querySelector<HTMLButtonElement>(".cart")?.addEventListener("click", () => { window.location.hash = "cart"; });
}

function renderRoute(): void { window.location.hash === "#cart" ? renderCartPage(app) : renderHome(); }
window.addEventListener("hashchange", renderRoute);
renderRoute();
