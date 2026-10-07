/* Shared header, footer and shop overlays for every page. Edit the menu or footer HERE once. */
(function () {
  var page = document.body.getAttribute('data-page') || '';
  var NAV = [['home', 'index.html', 'Home'], ['products', 'products.html', 'Buy products'], ['about', 'about.html', 'About'], ['services', 'services.html', 'Services'],
    ['workshops', 'workshops.html', 'Workshops'], ['gallery', 'gallery.html', 'Gallery'], ['contact', 'contact.html', 'Contact']];
  var CART = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="20.5" r="1.4"/><circle cx="18" cy="20.5" r="1.4"/><path d="M2 3h2.6l2.7 12.4a2 2 0 0 0 2 1.6h8.6a2 2 0 0 0 1.95-1.55L21.5 7H5.5"/></svg>';
  var SOC = [
    ['Facebook', 'https://www.facebook.com/profile.php?id=100068923792926', '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>'],
    ['Instagram', 'https://www.instagram.com/planthabitat2021est/', '<svg class="st" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4.2"/><circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" stroke="none"/></svg>'],
    ['TikTok', 'https://www.tiktok.com/@planthabitat2021', '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>']];
  var socHtml = SOC.map(function (x) { return '<a href="' + x[1] + '" target="_blank" rel="noopener" aria-label="Plant Habitat on ' + x[0] + '" title="' + x[0] + '">' + x[2] + '</a>'; }).join('');
  var links = NAV.map(function (n) { return '<li><a href="' + n[1] + '"' + (n[0] === page ? ' aria-current="page"' : '') + '>' + n[2] + '</a></li>'; }).join('');
  var top = '<div class="bar">Visit us daily, 8:00 AM – 5:00 PM · Call 0955 097 2296</div>' +
    '<header><div class="wrap nav"><a class="logo" href="index.html"><img src="images/logo.jpg" alt="" width="40" height="43">Plant Habitat</a>' +
    '<button id="menu" aria-expanded="false" aria-controls="links">Menu</button><ul id="links">' + links + '</ul>' +
    '<a class="btn" href="#" data-orders>My orders</a><button class="cart-btn" data-cart aria-label="Open your order">' + CART + '<span class="cart-count" hidden>0</span></button></div></header>';
  var foot = '<footer><div class="wrap"><div class="grid">' +
    '<div><h3>Plant Habitat</h3><p>Hydroponic produce, systems, greenhouses, and learning in San Fernando, Pampanga.</p></div>' +
    '<div><h3>Quick links</h3>' + NAV.map(function (n) { return '<a href="' + n[1] + '">' + n[2] + '</a>'; }).join('') + '</div>' +
    '<div><h3>Connect with us</h3><a href="tel:+639550972296">0955 097 2296</a><div class="soc">' + socHtml + '</div></div></div>' +
    '<p class="note" style="color:#9db3a5;margin-top:32px">© 2026 Plant Habitat. All rights reserved.</p></div></footer>';
  var shop = '<div class="pv" id="pv" hidden role="dialog" aria-modal="true" aria-label="Product details"><div class="pv-top"><a class="back" href="products.html#products">← Back to products</a>' +
    '<button class="cart-btn" data-cart aria-label="Open your order">' + CART + '<span class="cart-count" hidden>0</span></button></div><div class="pv-body wrap" id="pv-c"></div></div>' +
    '<div class="co" id="co" hidden role="dialog" aria-modal="true" aria-label="Checkout"><div class="pv-top"><button class="back" id="co-back" type="button">← Back to order</button><span class="co-title">Checkout</span></div>' +
    '<div class="co-body wrap"><div id="co-main"></div><div id="co-sum"></div></div></div>' +
    '<div class="ov" id="ov"></div><aside class="drawer" id="cart" role="dialog" aria-modal="true" aria-label="Your order"><div class="dr-head"><h2>Your order</h2><button id="cx" type="button" aria-label="Close">✕</button></div><div id="dr-body"></div></aside>';
  document.body.insertAdjacentHTML('afterbegin', top);
  document.body.insertAdjacentHTML('beforeend', foot + shop);
  [].forEach.call(document.querySelectorAll('[data-social]'), function (el) { el.innerHTML = socHtml; });
})();
