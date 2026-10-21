/* ==========================================================
   Product page: fill the template from PRODUCTS (?p=<id>)
   ========================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const id = new URLSearchParams(location.search).get('p');
  const idx = Math.max(0, PRODUCTS.findIndex((x) => x.id === id));
  const p = PRODUCTS[idx];
  const next = PRODUCTS[(idx + 1) % PRODUCTS.length];
  store.set('lastProduct', p.id);

  // colour world
  const root = document.documentElement.style;
  root.setProperty('--bg', p.theme.bg);
  root.setProperty('--bg2', p.theme.bg2);
  root.setProperty('--fg', p.theme.fg);
  root.setProperty('--next-bg', next.theme.bg);
  root.setProperty('--next-fg', next.theme.fg);
  $('meta[name="theme-color"]').setAttribute('content', p.theme.bg);
  document.title = `${p.name} | Star Pure Coconut Oil`;
  $('meta[name="description"]').setAttribute('content', `${p.name}: ${p.tagline}. Star Extra Premium Coconut Oil from Kannur, Kerala.`);

  const bind = (key, fn) => $$(`[data-bind="${key}"]`).forEach(fn);
  bind('l1', (el) => { el.textContent = p.title[0]; });
  bind('l2', (el) => { el.textContent = p.title[1]; });
  bind('script', (el) => { el.textContent = p.script; });
  bind('name', (el) => { el.textContent = p.name; });
  bind('kicker', (el) => { el.textContent = p.kicker; });
  bind('desc', (el) => { el.textContent = p.desc; });
  bind('tagline', (el) => { el.textContent = p.tagline; });
  bind('note', (el) => { el.textContent = `(${p.note})`; });
  bind('visual', (el) => { el.innerHTML = productVisual(p); });
  bind('wa', (el) => { el.href = waLink(`Hello Star Coconut Oil! I would like to order the ${p.name} (${p.kicker}).`); });
  bind('details', (el) => {
    el.innerHTML = p.details.map(([v, l], i) =>
      `<div class="detail" data-reveal style="--d:${i}"><strong>${v}</strong><span>${l}</span></div>`).join('');
  });
  bind('nextName', (el) => { el.textContent = next.name; });
  bind('nextVisual', (el) => { el.innerHTML = productVisual(next); });
  bind('nextLink', (el) => { el.href = `product.html?p=${next.id}`; });

  // pouring pack: rotate it so its mouth sits exactly on top of the stream
  const MOUTH = { 'ico-jar': [46, 16], 'ico-bottle': [60, 10], 'ico-pouch': [70, 14] };
  const place = (g, [mx, my]) =>
    g.setAttribute('transform', `translate(300 40) rotate(-138) scale(1.45) translate(${-mx} ${-my})`);
  bind('pourPack', (g) => {
    place(g, p.art.pour || MOUTH[p.art.sym]);
    g.setAttribute('style', `--body:${p.art.body || '#5ba52e'};--cap:${p.art.cap || '#3f7d22'};--oil:${p.art.oil}`);
    g.innerHTML = `<use href="#${p.art.sym}" width="140" height="180"/>`;
    const photo = new Image();
    photo.onload = () => {
      if (p.photoPour) place(g, p.photoPour);
      g.innerHTML = `<image href="${p.img}" width="140" height="180" preserveAspectRatio="xMidYMid meet"/>`;
    };
    photo.src = p.img;
  });
  const pour = $('.p-pour');
  new IntersectionObserver(([en], obs) => {
    if (en.isIntersecting) { pour.classList.add('is-pouring'); obs.disconnect(); }
  }, { threshold: 0.3 }).observe(pour);

  // details were added after initReveal ran, so observe them now
  const io = new IntersectionObserver((entries) => entries.forEach((en) => {
    if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
  }), { threshold: 0.2 });
  $$('.detail').forEach((d) => io.observe(d));

  // entrance once the curtain lifts (or right away on a direct visit)
  const enter = (delay) => setTimeout(() => document.body.classList.add('is-in'), delay);
  document.addEventListener('page:revealed', () => enter(350), { once: true });
  document.addEventListener('page:pending', () => enter(60), { once: true });

  // hero pack follows the mouse and drifts on scroll
  const visual = $('.p-hero__visual');
  const tilt = { x: 0, y: 0, tx: 0, ty: 0 };
  if (!reduceMotion && finePointer) { // phones have no hover: skip the tilt entirely
    window.addEventListener('pointermove', (e) => {
      tilt.tx = (e.clientX / innerWidth - 0.5) * 2;
      tilt.ty = (e.clientY / innerHeight - 0.5) * 2;
    }, { passive: true });
  }

  // arc text: slides along the curve, faster while scrolling.
  // Moving text on a path re-lays out every glyph, so only do it while the section is on screen,
  // and only repeat the text as often as the curve needs.
  const tp = $('.p-arc__text');
  const arcLen = $('#arcPath').getTotalLength();
  const unit = `${p.name} · Pure coconut oil · `;
  let unitLen = 0, offset = 0, boost = 0, lastY = scrollY, heroY = -1;
  const fill = () => {
    tp.textContent = unit;
    unitLen = tp.getComputedTextLength() || 1;
    tp.textContent = unit.repeat(Math.ceil(arcLen / unitLen) + 2);
  };
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(fill);
  fill();

  // pause the pour scene (text, stream, ripples, badge) whenever it's off screen
  const pourSection = $('.p-pour'), hero = $('.p-hero');
  let pourOn = false, heroOn = true;
  new IntersectionObserver(([en]) => {
    pourOn = en.isIntersecting;
    pourSection.classList.toggle('is-live', pourOn);
  }).observe(pourSection);
  new IntersectionObserver(([en]) => { heroOn = en.isIntersecting; }).observe(hero);

  const loop = () => {
    const y = scrollY;
    boost += (Math.abs(y - lastY) * 0.6 - boost) * 0.1;
    lastY = y;
    if (pourOn) {
      if (!reduceMotion) offset -= 0.6 + boost;
      if (offset < -unitLen) offset += unitLen;
      tp.setAttribute('startOffset', offset.toFixed(1));
    }
    if (heroOn && !reduceMotion) { // hero pack drifts with scroll and leans to the mouse
      const dx = tilt.tx - tilt.x, dy = tilt.ty - tilt.y;
      const tilting = Math.abs(dx) + Math.abs(dy) > 0.001;
      if (tilting) { tilt.x += dx * 0.12; tilt.y += dy * 0.12; }
      if (tilting || y !== heroY) { // skip the style write when nothing changed
        heroY = y;
        const st = visual.style;
        st.setProperty('--sy', `${(y * 0.25).toFixed(1)}px`);
        st.setProperty('--sr', `${(y * 0.02).toFixed(2)}deg`);
        st.setProperty('--mx', tilt.x.toFixed(3));
        st.setProperty('--my', tilt.y.toFixed(3));
      }
    }
    requestAnimationFrame(loop);
  };
  loop();
});
