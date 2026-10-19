/* ==========================================================
   Our Story + Contact: scroll effects, counters, form
   ========================================================== */

function initFillBottle() {
  const story = $('.s-story');
  if (!story) return;
  const bottle = $('.fill-bottle');
  const liquid = $('.fill-bottle__liquid');
  const meter = $('.fill-meter__num');
  const glow = $('.fill-glow');
  const steps = $('.steps');
  const EMPTY_Y = 380, FULL_Y = 92;

  const progress = (el, start, end) => {
    const r = el.getBoundingClientRect();
    const vh = innerHeight;
    return clamp((vh * start - r.top) / (vh * (start - end) + r.height * 0.5), 0, 1);
  };
  let ticking = false;
  const update = () => {
    ticking = false;
    const f = 1 - Math.pow(1 - progress(story, 0.95, 0.15), 2);
    liquid.setAttribute('transform', `translate(0 ${EMPTY_Y - (EMPTY_Y - FULL_Y) * f})`);
    bottle.style.setProperty('--fill', f);
    glow.style.setProperty('--fill', f);
    meter.textContent = Math.round(f * 100);
    if (steps) steps.style.setProperty('--line', progress(steps, 0.85, 0.35).toFixed(3));
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  addEventListener('resize', update);
  update();
}

function initCounters() {
  const els = $$('[data-count]');
  if (!els.length) return;
  const io = new IntersectionObserver((entries) => entries.forEach((en) => {
    if (!en.isIntersecting) return;
    io.unobserve(en.target);
    const el = en.target, end = +el.dataset.count, suffix = el.dataset.suffix || '';
    const start = end > 1000 ? end - 60 : 0;
    if (reduceMotion) { el.textContent = end + suffix; return; }
    const t0 = performance.now();
    const tick = (now) => {
      const p = clamp((now - t0) / 1800, 0, 1);
      el.textContent = Math.round(start + (end - start) * (1 - Math.pow(1 - p, 4))) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }), { threshold: 0.6 });
  els.forEach((el) => io.observe(el));
}

function initForm() {
  const form = $('.c-form');
  if (!form) return;
  const select = form.elements.product;
  select.innerHTML = [...PRODUCTS.map((p) => `${p.name} (${p.kicker})`), 'Bulk / wholesale supply']
    .map((t) => `<option>${t}</option>`).join('');
  const want = store.get('lastProduct');
  const i = PRODUCTS.findIndex((p) => p.id === want);
  if (i >= 0) select.selectedIndex = i;

  const note = $('.c-note', form);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const { name, phone, product, message } = form.elements;
    let ok = true;
    [name, phone].forEach((f) => {
      const bad = !f.value.trim();
      f.classList.toggle('is-invalid', bad);
      if (bad) ok = false;
    });
    if (!ok) { note.textContent = 'Please add your name and phone number.'; return; }
    note.textContent = 'Opening WhatsApp…';
    window.open(waLink(`Hello Star Coconut Oil!\nName: ${name.value.trim()}\nPhone: ${phone.value.trim()}\nInterested in: ${product.value}\n${message.value.trim()}`), '_blank', 'noopener');
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const enter = (delay) => setTimeout(() => document.body.classList.add('is-in'), delay);
  document.addEventListener('page:revealed', () => enter(350), { once: true });
  document.addEventListener('page:pending', () => enter(60), { once: true });
  initFillBottle();
  initCounters();
  initForm();
});
