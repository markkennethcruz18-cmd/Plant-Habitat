/* Animations: scroll reveal, number counters, header shadow, button ripple. Respects "reduce motion". */
(function () {
  var d = document, rm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches, hd = d.querySelector('header');
  function sc() { if (hd) hd.classList.toggle('scrolled', window.scrollY > 10); }
  addEventListener('scroll', sc, { passive: true }); sc();
  function count(el) {
    var to = +el.getAttribute('data-count'), t0 = null;
    if (rm || !window.requestAnimationFrame) { el.textContent = to; return; }
    function step(t) { if (t0 === null) t0 = t; var p = Math.min(1, (t - t0) / 1400); el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(step); }
    requestAnimationFrame(step);
  }
  function show(el) {
    el.classList.add('in');
    if (el.hasAttribute('data-count')) count(el);
    if (el.classList.contains('reveal')) setTimeout(function () { el.classList.remove('reveal', 'in'); el.style.removeProperty('--i'); }, 1500 + 90 * (+el.style.getPropertyValue('--i') || 0));
  }
  var io = !rm && 'IntersectionObserver' in window ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { io.unobserve(e.target); show(e.target); } });
  }, { threshold: .15, rootMargin: '0px 0px -40px 0px' }) : null;
  window.fxScan = function () {
    [].forEach.call(d.querySelectorAll('.stagger'), function (p) { [].forEach.call(p.children, function (c, i) { c.style.setProperty('--i', i); }); });
    [].forEach.call(d.querySelectorAll('.reveal:not([data-fx]),[data-count]:not([data-fx])'), function (el) {
      el.setAttribute('data-fx', '1');
      if (io) io.observe(el); else if (el.hasAttribute('data-count')) count(el); else el.classList.add('in');
    });
  };
  fxScan();
  d.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.btn'); if (!b || b.disabled || rm) return;
    var r = b.getBoundingClientRect(), s = d.createElement('span'), z = Math.max(r.width, r.height) * 2;
    s.className = 'ripple'; s.style.cssText = 'width:' + z + 'px;height:' + z + 'px;left:' + (e.clientX - r.left - z / 2) + 'px;top:' + (e.clientY - r.top - z / 2) + 'px';
    b.appendChild(s); setTimeout(function () { if (s.parentNode) s.parentNode.removeChild(s); }, 650);
  });
})();
