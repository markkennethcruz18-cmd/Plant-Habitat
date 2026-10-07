# Put Plant Habitat online (official website)

The site needs a host that runs Node.js, because orders and inquiries are received by `server.js`.
(GitHub Pages / Wix-style static hosting cannot receive orders.)

## Option A: Render.com (easiest, about ₱400/month, Starter plan)
1. Create a free account at github.com and a **private** repository; upload everything in this folder.
2. Create an account at render.com, click **New > Blueprint**, pick that repository. Render reads `render.yaml`.
3. Open the new service > **Environment** and read `ADMIN_PASSWORD` (generated for you). You can change it.
4. Your site is live at `https://plant-habitat.onrender.com`. Admin is at `/admin`.
5. Orders and inquiries are saved on the 1 GB disk (`/data`) and survive restarts and updates.

## Option B: any VPS (DigitalOcean, Vultr, etc.)
```
ADMIN_PASSWORD='your-strong-password' NODE_ENV=production node server.js
```
Put Nginx or Caddy in front for HTTPS, and set `TRUST_PROXY=1`. Back up the `data/` folder (or `DATA_DIR`).

## Your own domain (e.g. planthabitat.ph)
Buy the domain, then in Render > Settings > Custom Domains add it and follow the DNS steps. HTTPS is automatic.

## Before you announce it
- Replace placeholder prices/stock in **Admin > Products** (no code needed).
- Shipping is already set by distance (free nearby, up to ₱400 far). Change any fee in `window.SHIPPING` in `js/products.js`.
- GCash and bank transfer show "coming soon" at checkout. When you open the accounts, fill in `window.PAYMENT` in `js/products.js` (number, account name, bank) and they switch on automatically.
- Replace the illustrated pictures in `images/` with real photos (same file names).
- Test one order yourself: place it on the site, find it in Admin > Orders, move it to Delivered.

## What the owner sees in Admin (`/admin`)
- **Orders**: who bought what, quantities, totals, address, phone; change status step by step; cancel.
- **Inquiries**: every Contact-form message, with read/unread.
- **Products**: price, stock, out-of-stock for each item.

## Safety notes
- The server refuses to start in production with the password `root` or one under 8 characters.
- Admin login is limited to 8 tries/minute and sessions expire after 12 hours.
- Customers' names and phone numbers are stored: keep the password private and the repository private.

## Shipping fees (set by distance from San Fernando, Pampanga)
Free: San Fernando, Bacolor, Santa Rita, Mexico · ₱80 rest of Pampanga · ₱150 Central Luzon · ₱250 Metro Manila, CALABARZON, Ilocos, Cordillera, Cagayan Valley · ₱400 everywhere else. Pick-up is always free. Change them in `window.SHIPPING`.

## Payment
Buyers choose Cash on delivery / pay at pick-up, GCash, or Bank transfer. GCash and bank stay disabled ("coming soon") until `window.PAYMENT` has a number. In Admin each order shows the method and a **Mark as paid** button.

## Private test launch (before you tell anyone)
1. Add the environment variable `SITE_PRIVATE=1`. Search engines are told not to list the site, so only people with the link can find it.
2. Use a strong `ADMIN_PASSWORD` and share the link with nobody.
3. Place a few test orders and send a test inquiry, then check them in `/admin`.
4. When you are ready to launch officially, delete `SITE_PRIVATE` (and test orders if you wish) and share the link.
Free hosting plans sleep when idle and may erase saved orders, which is fine for testing but not for the real launch.
