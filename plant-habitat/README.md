# Plant Habitat website

```
plant-habitat/
├── index.html        Home (hero, featured products, services, about teaser)
├── products.html     Buy products (shop, product pages, cart, checkout)
├── about.html  services.html  workshops.html  gallery.html  contact.html
├── admin.html        Admin (orders, inquiries, products/stock/prices)
├── server.js         Run with: node server.js
├── css/styles.css    main styles          css/animations.css   animations
├── js/layout.js      header, menu and footer shared by every page (edit the menu HERE)
├── js/fx.js          scroll animations, counters, button ripple
├── js/products.js    default products     js/shop.js  cart, orders, checkout
├── js/main.js        mobile menu, contact form, gallery viewer
└── images/           logo.jpg, hero.jpg, products/, gallery/
```

## Adding real photos
Drop a `.jpg` into `images/products/` or `images/gallery/` using the exact
filename above. Until a file exists, the site shows the emoji / green
placeholder for that spot, so nothing looks broken.

Suggested sizes: products ~800x360, gallery ~1200x900 (4:3), hero ~800x864.
Keep each photo under ~300 KB so the page loads fast on mobile data.

To use a different filename or a .png/.webp, edit the src in index.html.
Open index.html in a browser to preview; no build step needed.

## Products, stock and prices
Buyers see the stock you set: "12 in stock" on the product card and page, and each variety shows its own amount. At 10 or less it changes to "Only N left" in orange. Leave Stock empty for no limit (nothing is shown) and 0 shows Out of stock.
Open `js/products.js`:
- `available: false` shows "Not available" on the card and product page and turns off buying.
- Each lettuce variety has its own `available` flag (e.g. mark only Crystal as unavailable).
- `price: null` shows "Ask for price". Put a number (e.g. `80`) to show ₱80.00 and an order total.

## How ordering works
Customer taps a product, picks options, and chooses Add to order or Buy it now. They fill in their details and
press **Place order**. The order goes to the admin page immediately and the customer sees a thank-you with an
order number. There is no text-message or call step and no online payment (cash on delivery / pick-up).
Orders only work when the site is running through `server.js` (see below).

## Contact form
Inquiries from the Contact section are sent to the admin page too (Inquiries tab) and saved in `data/inquiries.json`.

## Checkout and shipping
"Check out" / "Buy it now" opens a checkout page like the Buys store: contact, pick-up or ship, full address
(barangay, city, region), and an order summary with subtotal, shipping and total.
Shipping is extra and depends on distance: edit `window.SHIPPING` in `js/products.js`
(`nearAreas`, `nearFee`, `farFee`). Until fees are set, the customer sees "fee confirmed by us".

## Gallery
The Gallery page shows 6 cards, and each opens its own animated page: `gallery-greenhouses.html`, `gallery-lettuce.html`, `gallery-hydroponic-systems.html`, `gallery-workshops.html`, `gallery-construction-projects.html`, `gallery-harvest.html` (styles in `css/gallery.css`). Each page has 5 pictures (`lettuce.jpg`, `lettuce-2.jpg` ... `lettuce-5.jpg`) that open large with arrows and swipe.
The pictures in `images/gallery/` are generated illustrations. To use a real photo, save it over the same filename (e.g. `images/gallery/lettuce.jpg`) and both the card and its page update.

## NEW: orders, admin and tracking (needs Node.js 18+)
Run `node server.js` then open http://localhost:3000 (site) and http://localhost:3000/admin (orders).
Admin password: `root` unless you set the ADMIN_PASSWORD environment variable (e.g. `ADMIN_PASSWORD=mysecret node server.js`). Change it before putting the site online.
- Placing an order sends it to the admin page instantly; the customer gets an order number.
- Customers use "Track order" (order number + phone) to see Received → Confirmed → Preparing → Shipped → Out for delivery → Delivered (or Ready for pick-up → Completed). It refreshes every 20 seconds.
- Admin changes the status from the dropdown on each order. Orders are saved in `data/orders.json`.
- Prices are checked by the server. **Prices/fees in js/products.js are placeholders: set your real ones.**
- Address dropdowns (region, province, city, barangay) load from the free PSGC API; if it is offline the customer can type them.
- This needs a host that runs Node (VPS, Render, Railway). GitHub Pages / plain hosting cannot receive orders.

### My orders (no login)
The header **My orders** button opens tabs: All, To pay (Received/Confirmed), To ship (Preparing), To receive (Shipped/Out for delivery/Ready for pick-up), To review (Delivered/Completed, rating form). Orders are remembered on the customer's device.

### Cancel, stock and prices (new)
- **Buyers can cancel** from My orders (*Cancel order* button) only while the order is still **Received**. Once the admin sets it to Confirmed (or later), the button disappears and the server refuses cancellations.
- **Admin > Products tab**: for every product (and every lettuce variety) set the **price**, the **stock amount**, or tap **Mark out of stock** / **Back in stock**. Leave Stock empty for no limit; leave Price empty to show "Ask for price". Changes show on the site immediately and are saved in `data/products.json` (they override `js/products.js`).
- Stock goes down automatically when an order is placed, and is **returned if the order is cancelled** (by the buyer or by the admin). At 0 the item shows "Out of stock". Entering a new amount on a sold-out item puts it back on sale.
- Buyers cannot order more than what is left. A cancelled order cannot be reopened.

## Pages and animations (new)
The site is now separate pages: Home, Buy products, About, Services, Workshops, Gallery and Contact. The cart, My orders and checkout work on every page, and the cart is remembered when moving between pages.
To change the menu or footer, edit `js/layout.js` once and every page updates. Animations (scroll reveal, counters, floating leaves, hover effects) are in `css/animations.css` and `js/fx.js`; they switch off automatically for visitors who turn on "reduce motion" on their device.
