(function () {
  var P = window.PRODUCTS || [], KEY = 'ph-cart';
  var T = document.title, cart = [], st = null, view = 'cart', form = { name: '', phone: '', notes: '' };
  function $(s) { return document.querySelector(s); }
  function $$(s) { return [].slice.call(document.querySelectorAll(s)); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function money(n) { return '₱' + Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function find(id) { for (var i = 0; i < P.length; i++) if (P[i].id === id) return P[i]; }
  function inS(x) { return x.available !== false && (x.stock == null || x.stock > 0); }
  function vOk(p, i) { var v = p.variants && p.variants[i]; return !!v && inS(v); }
  /* stock shown to buyers: set by the admin; empty stock = no limit, so nothing is shown */
  function stkLabel(n) { return n <= 0 ? 'Out of stock' : n <= 10 ? 'Only ' + n + ' left' : n + ' in stock'; }
  function cardStock(p) {
    var n = 0, i, v;
    if (!p.variants) return p.stock != null && inS(p) ? p.stock : null;
    for (i = 0; i < p.variants.length; i++) { v = p.variants[i]; if (!inS(v)) continue; if (v.stock == null) return null; n += v.stock; }
    return n;
  }
  function cap(p, i) { var t = p.variants ? p.variants[i] : p; return t && t.stock != null ? Math.max(1, Math.min(99, t.stock)) : 99; }
  function ok(p) {
    if (!inS(p)) return false;
    if (!p.variants) return true;
    for (var i = 0; i < p.variants.length; i++) if (vOk(p, i)) return true;
    return false;
  }
  function pr(p, i) { var v = p.variants && p.variants[i]; return v && v.price != null ? v.price : (p.price != null ? p.price : null); }
  function cardPrice(p) {
    var a = [];
    if (p.variants) p.variants.forEach(function (v, i) { var x = pr(p, i); if (x != null) a.push(x); });
    else if (p.price != null) a.push(p.price);
    if (!a.length) return 'Ask for price';
    var m = Math.min.apply(null, a);
    return (a.some(function (x) { return x !== m; }) ? 'From ' : '') + money(m) + (p.unit ? ' ' + p.unit : '');
  }
  function photo(p) { return '<span aria-hidden="true">' + p.emoji + '</span><img data-photo src="' + esc(p.image) + '" alt="' + esc(p.name) + '" decoding="async">'; }

  /* photos: hide a missing image so the emoji / green placeholder shows */
  function watch() {
    $$('img[data-photo]:not([data-w])').forEach(function (img) {
      img.setAttribute('data-w', '1');
      function miss() { img.classList.add('is-missing'); var f = img.closest('figure'); if (f) f.classList.add('no-photo'); }
      img.addEventListener('error', miss);
      if (img.complete && img.naturalWidth === 0) miss();
    });
  }

  /* product cards */
  var firstCards = true;
  function cardHtml(p, base, rv) {
    var na = !ok(p), cs = cardStock(p);
    return '<a class="card prod' + (na ? ' na' : '') + (rv ? ' reveal' : '') + '" href="' + base + '#/product/' + esc(p.id) + '"><div class="img">' + photo(p) +
      (na ? '<span class="tag-na">Out of stock</span>' : '') + '</div><div class="pi"><h3>' + esc(p.name) + '</h3><p class="pp">' + cardPrice(p) + '</p>' + (cs == null || na ? '' : '<p class="stk' + (cs <= 10 ? ' low' : '') + '">' + stkLabel(cs) + '</p>') + '</div></a>';
  }
  function cards() {
    var g = $('#product-grid'), f = $('#featured-grid'), rv = firstCards;
    if (g) { g.innerHTML = P.map(function (p) { return cardHtml(p, '', rv); }).join(''); g.classList.add('stagger'); }
    if (f) { f.innerHTML = P.slice(0, 4).map(function (p) { return cardHtml(p, 'products.html', rv); }).join(''); f.classList.add('stagger'); }
    firstCards = false; watch(); if (window.fxScan) fxScan();
  }

  /* cart data */
  function load() {
    try { cart = JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { cart = []; }
    clean();
  }
  function clean() {
    cart = cart.filter(function (l) { var p = find(l.id); return p && ok(p) && (!p.variants || vOk(p, l.v)) && l.q > 0; });
    cart.forEach(function (l) { var c = cap(find(l.id), l.v); if (l.q > c) l.q = c; });
  }
  /* products come from the server so the admin's prices and stock are what customers see */
  function sync(cb) {
    if (location.protocol === 'file:') return cb && cb();
    fetch('/api/products', { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (a) {
      if (Array.isArray(a) && a.length) { P.length = 0; a.forEach(function (x) { P.push(x); }); }
      cb && cb();
    }, function () { cb && cb(); });
  }
  function count() {
    var n = cart.reduce(function (a, l) { return a + l.q; }, 0);
    $$('.cart-count').forEach(function (e) { var ch = e.textContent !== String(n); e.textContent = n; e.hidden = !n; if (ch && n) { e.classList.remove('pop'); void e.offsetWidth; e.classList.add('pop'); } });
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(cart)); } catch (e) {} count(); }
  function add(id, v, q) {
    for (var i = 0; i < cart.length; i++) if (cart[i].id === id && cart[i].v === v) { cart[i].q = Math.min(cap(find(id), v), cart[i].q + q); return save(); }
    cart.push({ id: id, v: v, q: Math.min(q, cap(find(id), v)) }); save();
  }
  function lineName(l) { var p = find(l.id); return p.name + (p.variants ? ' (' + p.variants[l.v].name + ')' : ''); }
  function total() {
    var t = 0;
    for (var i = 0; i < cart.length; i++) { var x = pr(find(cart[i].id), cart[i].v); if (x == null) return null; t += x * cart[i].q; }
    return t;
  }
  
  /* order drawer */
  function drawer() {
    var h;
    if (view === 'cart') {
      if (!cart.length) h = '<div class="dr-empty"><p>Your order is empty.</p><a class="btn" href="products.html#products" data-close>Browse products</a></div>';
      else {
        var t = total();
        h = '<ul class="lines">' + cart.map(function (l, i) {
          var p = find(l.id), x = pr(p, l.v);
          return '<li><div class="lt"><span class="ln">' + esc(p.name) + '</span>' + (p.variants ? '<span class="lv">' + esc(p.variants[l.v].name) + '</span>' : '') +
            '<span class="lp">' + (x == null ? 'Ask for price' : money(x)) + '</span></div><div class="qty"><button data-q="' + i + '" data-d="-1" aria-label="Less">−</button><span>' + l.q +
            '</span><button data-q="' + i + '" data-d="1" aria-label="More">+</button></div><button class="rm" data-rm="' + i + '">Remove</button></li>';
        }).join('') + '</ul><div class="tot"><span>Estimated total</span><strong>' + (t == null ? 'To be confirmed' : money(t)) +
          '</strong></div><p class="note">We will confirm availability and price with you.</p><button class="btn wide" data-go="co">Check out</button>';
      }
    }
    var mo = mine().length;
    if (mo) h += '<div class="dr-orders"><p class="note">You have ' + mo + ' placed order' + (mo > 1 ? 's' : '') + '.</p><button type="button" class="btn alt wide" data-orders="all">View my orders</button></div>';
    $('#dr-body').innerHTML = h;
  }
  function lock() { document.body.classList.toggle('lock', $('#cart').classList.contains('open') || !$('#pv').hidden || !$('#co').hidden); }
  function openD(v) { view = v || 'cart'; drawer(); $('#cart').classList.add('open'); $('#ov').classList.add('open'); lock(); $('#cx').focus(); }
  function closeD() { $('#cart').classList.remove('open'); $('#ov').classList.remove('open'); lock(); }

  $('#dr-body').addEventListener('click', function (e) {
    var t = e.target.closest('button,a'); if (!t) return;
    if (t.hasAttribute('data-close')) closeD();
    else if (t.hasAttribute('data-go')) { closeD(); openCO(); }
    else if (t.hasAttribute('data-q')) {
      var l = cart[+t.getAttribute('data-q')]; l.q += +t.getAttribute('data-d');
      if (l.q < 1) cart.splice(+t.getAttribute('data-q'), 1); else { var cp = cap(find(l.id), l.v); if (l.q > cp) l.q = cp; }
      save(); drawer();
    } else if (t.hasAttribute('data-rm')) { cart.splice(+t.getAttribute('data-rm'), 1); save(); drawer(); }
  });
  $('#cx').onclick = closeD; $('#ov').onclick = closeD;
  document.addEventListener('click', function (e) { if (e.target.closest('[data-cart]')) openD('cart'); });

  /* product page */
  function drawPV() {
    var p = st.p, a = ok(p), x = pr(p, st.vi);
    var h = '<div class="pv-media">' + photo(p) + (a ? '' : '<span class="tag-na">Out of stock</span>') + '</div><div class="pv-info"><h1>' + esc(p.name) +
      '</h1><p class="pv-price">' + (x == null ? 'Ask for price' : money(x) + (p.unit ? ' <small>' + p.unit + '</small>' : '')) + '</p><p class="lead">' + esc(p.desc) + '</p>';
    var tg = p.variants ? p.variants[st.vi] : p;
    if (a && tg && tg.stock != null) h += '<p class="stk' + (tg.stock <= 10 ? ' low' : '') + '"><b>' + stkLabel(tg.stock) + '</b></p>';
    if (p.variants) h += '<fieldset class="vr"><legend>' + esc(p.variantLabel || 'Option') + '</legend>' + p.variants.map(function (v, i) {
      var o = vOk(p, i);
      return '<button type="button" class="pill" data-vi="' + i + '" aria-pressed="' + (i === st.vi) + '"' + (o ? '' : ' disabled') + '>' + esc(v.name) + (o ? (v.stock != null ? ' · ' + v.stock + ' in stock' : '') : ' · Out of stock') + '</button>';
    }).join('') + '</fieldset>';
    if (a) h += '<div class="qrow"><span>Quantity</span><div class="qty"><button data-pq="-1" aria-label="Decrease">−</button><span id="pq">' + st.q +
      '</span><button data-pq="1" aria-label="Increase">+</button></div></div><button class="btn wide" data-act="add">Add to order</button><button class="btn alt wide" data-act="buy">Buy it now</button>';
    else h += '<button class="btn wide" disabled>Out of stock</button><p class="note">This item is out of stock right now. <a href="contact.html">Contact us</a> to ask if it will be back.</p>';
    $('#pv-c').innerHTML = h + '</div>'; watch();
  }
  function pv(id) {
    var p = find(id), el = $('#pv');
    if (!p) { el.hidden = true; document.title = T; lock(); return; }
    var vi = -1;
    if (p.variants) for (var i = 0; i < p.variants.length; i++) if (vOk(p, i)) { vi = i; break; }
    st = { p: p, vi: vi, q: 1 }; drawPV(); el.hidden = false; el.scrollTop = 0; document.title = p.name + ' | Plant Habitat'; lock();
  }
  $('#pv-c').addEventListener('click', function (e) {
    var t = e.target.closest('button'); if (!t || t.disabled) return;
    if (t.hasAttribute('data-vi')) { st.vi = +t.getAttribute('data-vi'); drawPV(); }
    else if (t.hasAttribute('data-pq')) { st.q = Math.max(1, Math.min(cap(st.p, st.vi), st.q + +t.getAttribute('data-pq'))); $('#pq').textContent = st.q; }
    else if (t.hasAttribute('data-act')) { add(st.p.id, st.vi, st.q); if (t.getAttribute('data-act') === 'buy') openCO(); else openD('cart'); }
  });
  function route() {
    var m = location.hash.match(/^#\/product\/([\w-]+)/);
    if (m) pv(m[1]); else { $('#pv').hidden = true; document.title = T; lock(); }
  }
  window.addEventListener('hashchange', route);
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (!$('#co').hidden) closeCO(); else if ($('#cart').classList.contains('open')) closeD(); else if (!$('#pv').hidden) location.hash = '#products';
  });

  /* checkout page */
  var co = { ship: false, done: false, d: { first: '', last: '', email: '', phone: '', addr: '', apt: '', brgy: '', zip: '', city: '', region: '', prov: '', country: 'Philippines', notes: '', pay: 'cod' } };
  var S = window.SHIPPING || {};
  function fee() {
    if (!co.ship) return { txt: 'Pick-up (free)', a: 0 };
    if (!co.d.city.trim()) return { txt: 'Enter shipping address', a: null };
    if (co.d.country !== 'Philippines') return { txt: 'We deliver within the Philippines only', a: null };
    var z = window.shipFee({ city: co.d.city, barangay: co.d.brgy, province: co.d.prov, region: co.d.region });
    return { txt: z.zone + (z.fee ? ': ' + money(z.fee) : ': FREE'), a: z.fee };
  }
  /* payment methods: GCash / bank are selectable only after their details are filled in (js/products.js) */
  var PAY = window.PAYMENT || {};
  function payOn(k) { return k === 'cod' || !!(PAY[k] && PAY[k].number); }
  function payName(k) { return k === 'gcash' ? 'GCash' : k === 'bank' ? 'Bank transfer' : (co.ship ? 'Cash on delivery' : 'Pay at pick-up'); }
  function payInfo(k) {
    var p = PAY[k] || {};
    if (k === 'gcash') return 'Send to GCash <b>' + esc(p.number) + '</b>' + (p.accountName ? ' (' + esc(p.accountName) + ')' : '');
    if (k === 'bank') return 'Transfer to ' + esc(p.bankName || 'our bank') + ' account <b>' + esc(p.number) + '</b>' + (p.accountName ? ' (' + esc(p.accountName) + ')' : '');
    return '';
  }
  function payBox() {
    var h = '<h2>How would you like to pay?</h2><div class="dm">';
    [['cod', co.ship ? 'Cash on delivery' : 'Pay in cash at pick-up', 'Pay in cash when ' + (co.ship ? 'your order arrives.' : 'you pick up your order.')], ['gcash', 'GCash', 'Pay by GCash after we confirm your order.'], ['bank', 'Bank transfer', 'Pay by bank transfer after we confirm your order.']].forEach(function (m) {
      var on = payOn(m[0]);
      h += '<label class="opt"' + (on ? '' : ' style="opacity:.55"') + '><input type="radio" name="pay" value="' + m[0] + '"' + (co.d.pay === m[0] && on ? ' checked' : '') + (on ? '' : ' disabled') + '> <span><b>' + m[1] + '</b>' + (on ? '' : ' <em>(coming soon)</em>') + '<br><small>' + (on ? m[2] : 'Not available yet. Please choose another method.') + '</small></span></label>';
    });
    return h + '</div>' + (co.d.pay === 'cod' ? '' : '<p class="note">Account details are shown after you place your order. Please pay only after we confirm it.</p>');
  }
  function grand() { var t = total(), f = fee(); return t == null || f.a == null ? null : t + f.a; }
  function summary() {
    var t = total(), g = grand();
    return '<ul class="sl">' + cart.map(function (l) {
      var p = find(l.id), x = pr(p, l.v);
      return '<li><span class="th">' + p.emoji + '<b>' + l.q + '</b></span><span>' + esc(lineName(l)) + '</span><span>' + (x == null ? '—' : money(x * l.q)) + '</span></li>';
    }).join('') + '</ul><div class="sr"><span>Subtotal</span><span>' + (t == null ? 'To be confirmed' : money(t)) + '</span></div><div class="sr"><span>Shipping</span><span>' + fee().txt +
      '</span></div><div class="sr tt"><span>Total</span><strong>' + (g == null ? 'To be confirmed' : money(g)) + '</strong></div>';
  }
  var G = { r: [], p: [], c: [], b: [], codes: {} }, API = 'https://psgc.gitlab.io/api/';
  function get(u, cb) { fetch(API + u).then(function (r) { return r.json(); }).then(cb, function () { cb(null); }); }
  function names(a) { return (a || []).map(function (x) { G.codes[x.name] = x.code; return x.name; }).sort(); }
  function loadR() { if (G.r.length) return; get('regions/', function (a) { if (a) { G.r = names(a); renderCO(); } }); }
  function pick(n, v) {
    co.d[n] = v; var c = G.codes[v];
    if (n === 'region') { co.d.prov = co.d.city = co.d.brgy = ''; G.p = G.c = G.b = []; if (c) get('regions/' + c + '/provinces/', function (a) { G.p = names(a); if (a && !a.length) get('regions/' + c + '/cities-municipalities/', function (b) { G.c = names(b); renderCO(); }); else renderCO(); }); }
    if (n === 'prov') { co.d.city = co.d.brgy = ''; G.c = G.b = []; if (c) get('provinces/' + c + '/cities-municipalities/', function (a) { G.c = names(a); renderCO(); }); }
    if (n === 'city') { co.d.brgy = ''; G.b = []; if (c) get('cities-municipalities/' + c + '/barangays/', function (a) { G.b = names(a); renderCO(); }); }
    renderCO();
  }
  function coForm() {
    var d = co.d; loadR();
    function f(n, l, x) { x = x || {}; return '<label>' + l + '<input name="' + n + '" value="' + esc(d[n]) + '"' + (x.req ? ' required' : '') + (x.t ? ' type="' + x.t + '"' : '') + (x.ac ? ' autocomplete="' + x.ac + '"' : '') + '></label>'; }
    function sel(n, l, list) {
      if (!list.length || d.country !== 'Philippines') return f(n, l, { req: 1 });
      return '<label>' + l + '<select name="' + n + '" data-geo required><option value="">Select ' + l.toLowerCase() + '</option>' + list.map(function (v) { return '<option' + (v === d[n] ? ' selected' : '') + '>' + esc(v) + '</option>'; }).join('') + '</select></label>';
    }
    return '<form id="cof"><h2>Your details</h2><div class="two">' + f('first', 'First name', { req: 1, ac: 'given-name' }) + f('last', 'Last name', { req: 1, ac: 'family-name' }) + '</div>' +
      f('phone', 'Phone', { req: 1, t: 'tel', ac: 'tel' }) + f('email', 'Email (optional)', { t: 'email', ac: 'email' }) +
      '<h2>Pick up or delivery?</h2><div class="dm"><label class="opt"><input type="radio" name="ship" value="0"' + (co.ship ? '' : ' checked') + '> Pick up at Plant Habitat (free)</label>' +
      '<label class="opt"><input type="radio" name="ship" value="1"' + (co.ship ? ' checked' : '') + '> Deliver to my address</label></div>' +
      (co.ship ? '<h2>Delivery address</h2><label>Country<select name="country"><option>Philippines</option><option>Other country</option></select></label>' + sel('region', 'Region', G.r) + sel('prov', 'Province', G.p) + sel('city', 'City / Municipality', G.c) + sel('brgy', 'Barangay', G.b) +
        '<div class="two">' + f('zip', 'Postal code', { ac: 'postal-code' }) + f('addr', 'Street and house no.', { req: 1, ac: 'address-line1' }) + '</div><p class="note">Delivery fee depends on your distance from our farm in San Fernando, Pampanga: free nearby, higher the farther you are. We deliver within the Philippines only.</p>' : '') + payBox() +
      '<label>Notes (optional)<textarea name="notes" rows="2">' + esc(d.notes) + '</textarea></label><p id="coe" class="note" role="alert"></p><button class="btn wide" type="submit">Place order</button></form>';
  }
  function coDone() {
    var o = co.order;
    if (!o) return '<h2>Sorry, your order was not sent</h2><p role="alert">We could not reach our order system. Nothing was charged. Please check your internet connection and try again.</p><button class="btn wide" data-edit>Try again</button><button class="btn alt wide" id="fin">Close</button>';
    return '<h2>✅ Thank you for buying!</h2><p>Thank you, ' + esc(o.name) + '! Your order was sent to our team right away and we will start preparing it.</p><p class="pv-price">Order no. ' + esc(o.code) + '</p><p><b>Payment:</b> ' + payName(o.pay) + (o.pay === 'cod' ? '' : '. ' + payInfo(o.pay) + '. Please wait for our confirmation first, then send your payment with <b>' + esc(o.code) + '</b> as the reference and message us the receipt.') + '</p><p class="note">Save this number. You can follow your order any time under My orders (no login needed).</p><button class="btn wide" data-orders="pay">View my orders</button><button class="btn alt wide" id="fin">Done</button>';
  }
  /* My orders: no login needed, orders are remembered on this phone/computer */
  var TABS = [['all', 'All'], ['pay', 'To pay'], ['ship', 'To ship'], ['recv', 'To receive'], ['rev', 'To review'], ['cx', 'Cancelled']];
  var GRP = { 'Received': 'pay', 'Confirmed': 'pay', 'Preparing': 'ship', 'Shipped': 'recv', 'Out for delivery': 'recv', 'Ready for pick-up': 'recv', 'Delivered': 'rev', 'Completed': 'rev' };
  var my = { tab: 'all', list: [], t: null, msg: '' };
  function mine() { try { return JSON.parse(localStorage.getItem('ph-orders') || '[]'); } catch (e) { return []; } }
  function inTab(o, t) { if (t === 'cx') return o.status === 'Cancelled'; return t === 'all' || (o.status !== 'Cancelled' && GRP[o.status] === t && !(t === 'rev' && o.review)); }
  function ocard(o) {
    var ix = o.flow.indexOf(o.status), bad = o.status === 'Cancelled';
    var h = '<div class="oc"><div class="oh"><b>' + esc(o.code) + '</b><span class="st">' + esc(o.status) + '</span></div><p>' + o.items.map(function (i) { return esc(i.name) + ' x' + i.q; }).join('<br>') + '</p><p>Total <b>' + money(o.total) + '</b> · ' + (o.ship ? 'Delivery' : 'Pick-up') + '</p>';
    if (o.status === 'Received') h += '<p class="note">You can cancel this order until we confirm it.</p><details class="cxl"><summary class="btn alt">Cancel order</summary><form data-cxl="' + esc(o.code) + '"><label>Why are you cancelling?<select name="why" required><option value="">Select a reason</option><option>I changed my mind</option><option>I ordered by mistake</option><option>I want to change the items or quantity</option><option>I found a better price</option><option>Delivery or pick-up would take too long</option><option>Other</option></select></label><label>More details (optional)<textarea name="more" rows="2" maxlength="200"></textarea></label><button class="btn">Confirm cancellation</button></form></details>';
    else if (!bad && ix > 0 && ix < 2) h += '<p class="note">This order is confirmed, so it can no longer be cancelled here. Please contact us if you need help.</p>';
    if (bad && o.cancelReason) h += '<p class="note">Reason for cancelling: ' + esc(o.cancelReason) + '</p>';
    if (!bad) h += '<ol class="tl">' + o.flow.map(function (s, k) { return '<li class="' + (k < ix ? 'done' : k === ix ? 'now' : '') + '">' + s + '</li>'; }).join('') + '</ol>';
    if (GRP[o.status] === 'rev' && !o.review) h += '<form data-rv="' + esc(o.code) + '"><label>Your rating<select name="rvr"><option value="5">★★★★★ Great</option><option value="4">★★★★ Good</option><option value="3">★★★ OK</option><option value="2">★★ Poor</option><option value="1">★ Bad</option></select></label><label>Comment (optional)<textarea name="rvt" rows="2"></textarea></label><button class="btn">Submit review</button></form>';
    else if (o.review) h += '<p class="note">Your review: ' + '★'.repeat(o.review.rating) + ' ' + esc(o.review.text) + '</p>';
    return h + '</div>';
  }
  function ordersView() {
    var L = my.list.filter(function (o) { return inTab(o, my.tab); });
    return '<h2>My orders</h2>' + (cart.length ? '<p><button type="button" class="btn alt" data-mycart>🛒 View my cart (' + cart.reduce(function (a, l) { return a + l.q; }, 0) + ')</button></p>' : '') + '<div class="tabs">' + TABS.map(function (t) {
      var n = t[0] === 'all' ? 0 : my.list.filter(function (o) { return inTab(o, t[0]); }).length;
      return '<button type="button" data-tab="' + t[0] + '" aria-pressed="' + (my.tab === t[0]) + '">' + t[1] + (n ? ' (' + n + ')' : '') + '</button>';
    }).join('') + '</div>' + (L.length ? L.map(ocard).join('') : '<p class="note">No orders here yet.</p>') +
      '<details><summary>Ordered on another phone? Find your order</summary><form id="trf"><label>Order number<input name="code" required></label><label>Phone number<input name="phone" type="tel" required></label><button class="btn">Find order</button></form></details><p class="note" role="alert">' + esc(my.msg) + '</p>';
  }
  function refresh(x) {
    var L = mine(); if (x) L.unshift(x);
    fetch('/api/mine', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ list: L }) }).then(function (r) { return r.json(); }).then(function (a) {
      if (x) {
        if (a.some(function (o) { return o.code === x.code; })) { var s2 = mine().filter(function (y) { return y.code !== x.code; }); s2.unshift(x); try { localStorage.setItem('ph-orders', JSON.stringify(s2.slice(0, 20))); } catch (e) {} my.msg = ''; }
        else my.msg = 'No order found. Check the order number and phone.';
      }
      my.list = a; var ae = document.activeElement;
      if (co.trk && !$('#co').hidden && (x || ((!ae || !ae.closest || !ae.closest('#co-main') || !/INPUT|TEXTAREA|SELECT/.test(ae.tagName)) && !$('#co-main details[open]')))) $('#co-main').innerHTML = ordersView();
    }, function () { my.msg = 'Cannot connect right now.'; });
  }
  function openOrders(tab) {
    my.tab = tab || 'all'; my.msg = ''; co.trk = true; closeD();
    $('.co-title').textContent = 'My orders'; $('#co-back').textContent = '← Back to shop'; $('#co').classList.add('one');
    $('#co-main').innerHTML = ordersView(); $('#co-sum').innerHTML = ''; $('#co').hidden = false; $('#co').scrollTop = 0; lock();
    clearInterval(my.t); refresh(); my.t = setInterval(function () { refresh(); }, 20000);
  }
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-orders]'); if (t) { e.preventDefault(); return openOrders(t.getAttribute('data-orders')); }
    t = e.target.closest('[data-tab]'); if (t && $('#co-main').contains(t)) { my.tab = t.getAttribute('data-tab'); $('#co-main').innerHTML = ordersView(); }
  });
  $('#co-main').addEventListener('submit', function (e) {
    var f = e.target;
    if (f.id === 'trf') { e.preventDefault(); refresh({ code: f.code.value.toUpperCase().trim(), phone: f.phone.value }); }
    else if (f.hasAttribute('data-cxl')) {
      e.preventDefault(); var cc = f.getAttribute('data-cxl'), mm = mine().filter(function (y) { return y.code === cc; })[0] || {};
      var why = f.why.value + (f.more.value.trim() ? ': ' + f.more.value.trim() : ''), sb = f.querySelector('button'); sb.disabled = true;
      fetch('/api/cancel', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: cc, phone: mm.phone, reason: why }) }).then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); }).then(function (r) {
        my.msg = r.ok ? 'Order ' + cc + ' was cancelled.' : (r.j.error || 'Could not cancel this order.'); sb.disabled = false; $('#co-main').innerHTML = ordersView(); refresh();
      }, function () { my.msg = 'Cannot connect right now.'; sb.disabled = false; $('#co-main').innerHTML = ordersView(); });
    }
    else if (f.hasAttribute('data-rv')) {
      e.preventDefault(); var c = f.getAttribute('data-rv'), m = mine().filter(function (y) { return y.code === c; })[0] || {};
      fetch('/api/review', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: c, phone: m.phone, rating: f.rvr.value, text: f.rvt.value }) }).then(function () { refresh(); });
    }
  });
  function renderCO() { co.trk = false; var y = $('#co').scrollTop; $('#co-main').innerHTML = co.done ? coDone() : coForm(); $('#co-sum').innerHTML = summary(); $('#co').scrollTop = y; }
  function openCO() { if (!cart.length) return; var before = JSON.stringify(cart); sync(function () { clean(); save(); if (JSON.stringify(cart) !== before && !$('#co').hidden && !co.done && !co.trk) { if (!cart.length) { closeCO(); openD('cart'); } else renderCO(); } }); co.done = false; co.order = null; co.err = false; clearInterval(my.t); $('.co-title').textContent = 'Checkout'; $('#co-back').textContent = '← Back to order'; $('#co').classList.remove('one'); renderCO(); $('#co').hidden = false; $('#co').scrollTop = 0; lock(); }
  function closeCO() { $('#co').hidden = true; co.trk = false; clearInterval(my.t); lock(); }
  $('#co').addEventListener('input', function (e) {
    var n = e.target.name; if (!n) return;
    if (e.target.hasAttribute('data-geo')) return pick(n, e.target.value);
    if (n === 'country') { co.d.country = e.target.value === 'Philippines' ? 'Philippines' : 'Other'; co.d.region = co.d.prov = co.d.city = co.d.brgy = ''; return renderCO(); }
    if (n === 'ship') { co.ship = e.target.value === '1'; renderCO(); return; }
    co.d[n] = e.target.value;
    if (n === 'city' || n === 'brgy') $('#co-sum').innerHTML = summary();
  });
  $('#co-main').addEventListener('submit', function (e) {
    if (e.target.id !== 'cof') return; e.preventDefault(); var d = co.d, btn = e.target.querySelector('button[type=submit]'); btn.disabled = true; btn.textContent = 'Sending…';
    var body = { name: (d.first + ' ' + d.last).trim(), phone: d.phone, email: d.email, notes: d.notes, pay: d.pay || 'cod', ship: co.ship, cart: cart, address: co.ship ? { country: d.country, region: d.region, province: d.prov, city: d.city, barangay: d.brgy, postal: d.zip, street: d.addr } : null };
    fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); }).then(function (r) {
      if (!r.ok) { btn.disabled = false; btn.textContent = 'Place order'; $('#coe').textContent = r.j.error || 'Something went wrong.'; return; }
      co.order = r.j; co.done = true; try { var l = mine(); l.unshift({ code: r.j.code, phone: d.phone }); localStorage.setItem('ph-orders', JSON.stringify(l.slice(0, 10))); } catch (x) {}
      cart = []; save(); renderCO(); $('#co-sum').innerHTML = ''; $('#co').scrollTop = 0;
    }, function () { co.err = true; co.done = true; renderCO(); });
  });
  $('#co').addEventListener('click', function (e) {
    var t = e.target.closest('button'); if (!t) return;
    if (t.hasAttribute('data-mycart')) { closeCO(); openD('cart'); return; }
    if (t.id === 'co-back') { var w = co.trk; closeCO(); if (!w) openD('cart'); }
    else if (t.hasAttribute('data-edit')) { co.done = false; renderCO(); }
    else if (t.id === 'fin') { closeCO(); }
  });

  cards(); load(); count(); watch(); route();
  sync(function () { cards(); load(); count(); route(); });
})();
