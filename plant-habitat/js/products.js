/* PRICES BELOW ARE PLACEHOLDERS: replace with your real prices.
   EDIT THIS FILE to change what is for sale.
   available:false  -> card and page show "Not available" and buying is turned off.
   price:null       -> shows "Ask for price". Use a number (e.g. 80) to show ₱80.00 and a total.
   Each variant can have its own available / price. */
window.PRODUCTS = [
  { id: 'lettuce', name: 'Lettuce', emoji: '🥬', image: 'images/products/lettuce.jpg',
    desc: 'Fresh hydroponically grown lettuce and leafy greens. Romaine, Lollo Bionda, and Crystal varieties.',
    available: true, price: 80, unit: 'per head', variantLabel: 'Variety',
    variants: [
      { name: 'Romaine', available: true, price: 80 },
      { name: 'Lollo Bionda', available: true, price: 85 },
      { name: 'Crystal', available: true, price: 90 }
    ] },
  { id: 'basil', name: 'Basil', emoji: '🌿', image: 'images/products/basil.jpg',
    desc: 'Fresh hydroponic basil.', available: true, price: 60, unit: 'per pack' },
  { id: 'arugula', name: 'Arugula', emoji: '🍃', image: 'images/products/arugula.jpg',
    desc: 'Peppery leafy greens, grown hydroponically.', available: true, price: 70, unit: 'per pack' },
  { id: 'seeds-seedlings', name: 'Seeds & Seedlings', emoji: '🌱', image: 'images/products/seeds-seedlings.jpg',
    desc: 'Start your own system with quality starts.', available: true, price: 25, unit: 'per seedling' },
  { id: 'hydroponic-materials', name: 'Hydroponic Materials', emoji: '🧪', image: 'images/products/hydroponic-materials.jpg',
    desc: 'Supplies for building and running your setup.', available: true, price: 150, unit: 'per set' },
  { id: 'system-components', name: 'System Components', emoji: '🧰', image: 'images/products/system-components.jpg',
    desc: 'Parts for Kratky and NFT systems.', available: true, price: 250, unit: 'per piece' }
];

/* SHIPPING: the fee goes UP the farther the customer is from Plant Habitat (San Fernando, Pampanga).
   Zones are checked top to bottom; the first one that matches the customer's address wins.
   fee: 0 = free delivery.  Change any fee or add towns/provinces below; no other file needs editing.
   Prices are in pesos. Pick-up at the farm is always free. */
window.SHIPPING = {
  zones: [
    { name: 'Nearby', fee: 0, province: ['pampanga'], city: ['san fernando', 'bacolor', 'santa rita', 'mexico'] },
    { name: 'Pampanga', fee: 80, province: ['pampanga'] },
    { name: 'Central Luzon', fee: 150, province: ['bulacan', 'tarlac', 'bataan', 'zambales', 'nueva ecija', 'aurora', 'central luzon'] },
    { name: 'Metro Manila and nearby', fee: 250, province: ['national capital', 'ncr', 'calabarzon', 'cavite', 'laguna', 'rizal', 'batangas', 'quezon', 'pangasinan', 'ilocos', 'cordillera', 'benguet', 'cagayan valley'] }
  ],
  farName: 'Far area (Visayas, Mindanao, other)', farFee: 400
};
/* Works out the delivery fee for an address: { city, province, region, barangay }. Used by the site AND the server. */
window.shipFee = function (a) {
  var Z = window.SHIPPING, loc = [a.city, a.barangay, a.province, a.region].join(' ').toLowerCase(), cty = String(a.city || '').toLowerCase();
  var has = function (list, t) { return (list || []).some(function (n) { return t.indexOf(n) > -1; }); };
  for (var i = 0; i < Z.zones.length; i++) {
    var z = Z.zones[i];
    if (z.province && !has(z.province, loc)) continue;
    if (z.city && !has(z.city, cty)) continue;
    return { zone: z.name, fee: z.fee };
  }
  return { zone: Z.farName, fee: Z.farFee };
};

/* PAYMENT: shown to the buyer at checkout and on the thank-you page.
   Cash on delivery / pick-up is ready. GCash and bank transfer show as "Coming soon" until you fill in the
   details below. As soon as you type a number (GCash) or an account number (bank), buyers can pick them. */
window.PAYMENT = {
  cod:   { label: 'Cash on delivery / pay at pick-up', hint: 'Pay in cash when your order arrives or when you pick it up.' },
  gcash: { label: 'GCash', accountName: '', number: '' },                       /* e.g. accountName: 'Plant Habitat', number: '0955 000 0000' */
  bank:  { label: 'Bank transfer', bankName: '', accountName: '', number: '' }  /* e.g. bankName: 'BDO', accountName: 'Plant Habitat', number: '0000 0000 0000' */
};
