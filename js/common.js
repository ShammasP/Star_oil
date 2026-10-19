/* ==========================================================
   Shared: header + menu, footer, oil page transition, cursor,
   scroll reveal, product illustrations
   ========================================================== */

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const store = {
  get(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { sessionStorage.setItem(k, v); } catch (e) { /* private mode */ } },
  del(k) { try { sessionStorage.removeItem(k); } catch (e) { /* private mode */ } },
};
const waLink = (text) => `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(text)}`;

/* ---------- Product illustrations (shown until real photos are added) ---------- */
const SPRITE = `
<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
  <symbol id="ico-jar" viewBox="0 0 140 180">
    <path d="M80 44V30q0-14 14-14h10q14 0 14 14v20" fill="none" stroke="var(--body)" stroke-width="12" stroke-linecap="round"/>
    <rect x="30" y="16" width="32" height="26" rx="5" fill="var(--cap)"/>
    <rect x="16" y="38" width="108" height="136" rx="18" fill="var(--body)"/>
    <rect x="16" y="110" width="108" height="64" rx="18" fill="var(--oil)" opacity=".55"/>
    <rect x="24" y="76" width="92" height="74" rx="7" fill="#5ba52e"/>
    <path d="M24 136q46-14 92 0v7q0 7-7 7H31q-7 0-7-7z" fill="#3f7d22"/>
    <ellipse cx="70" cy="94" rx="27" ry="10" fill="#fff"/><ellipse cx="70" cy="94" rx="24.5" ry="8.2" fill="#c8202b"/>
    <text x="70" y="98" text-anchor="middle" font-family="Georgia,serif" font-weight="700" font-size="10.5" fill="#fff" letter-spacing="1">STAR</text>
    <circle cx="56" cy="122" r="11" fill="#6b3e1d"/><circle cx="56" cy="122" r="7.5" fill="#fffaf0"/>
    <rect x="74" y="112" width="18" height="24" rx="4" fill="#f6e7a4"/>
    <text x="70" y="146" text-anchor="middle" font-family="Outfit,sans-serif" font-weight="600" font-size="6.5" fill="#fff">COCONUT OIL</text>
    <rect x="21" y="46" width="7" height="118" rx="3.5" fill="#fff" opacity=".35"/>
  </symbol>
  <symbol id="ico-bottle" viewBox="0 0 140 180">
    <path d="M78 54V42q0-10 10-10h6q10 0 10 10v26" fill="none" stroke="var(--body)" stroke-width="9" stroke-linecap="round"/>
    <rect x="46" y="10" width="28" height="18" rx="4" fill="var(--cap)"/>
    <rect x="49" y="26" width="22" height="16" fill="var(--body)"/>
    <path d="M49 40h22l18 14q12 9 12 22v86q0 12-12 12H43q-12 0-12-12V76q0-13 12-22z" fill="var(--body)"/>
    <path d="M31 112h70v50q0 12-12 12H43q-12 0-12-12z" fill="var(--oil)" opacity=".55"/>
    <rect x="35" y="84" width="62" height="58" rx="6" fill="#5ba52e"/>
    <ellipse cx="66" cy="98" rx="20" ry="7.5" fill="#fff"/><ellipse cx="66" cy="98" rx="18" ry="6" fill="#c8202b"/>
    <text x="66" y="101" text-anchor="middle" font-family="Georgia,serif" font-weight="700" font-size="8" fill="#fff" letter-spacing="1">STAR</text>
    <circle cx="56" cy="122" r="9" fill="#6b3e1d"/><circle cx="56" cy="122" r="6" fill="#fffaf0"/>
    <rect x="70" y="113" width="14" height="19" rx="3" fill="#f6e7a4"/>
    <rect x="36" y="60" width="6" height="100" rx="3" fill="#fff" opacity=".35"/>
  </symbol>
  <symbol id="ico-pouch" viewBox="0 0 140 180">
    <path d="M34 14h72l6 10v142q0 8-8 8H36q-8 0-8-8V24z" fill="#5ba52e"/>
    <rect x="28" y="14" width="84" height="12" fill="#3f7d22"/>
    <path d="M28 120q42-18 84 0v46q0 8-8 8H36q-8 0-8-8z" fill="#3f7d22"/>
    <rect x="40" y="96" width="60" height="40" rx="8" fill="var(--oil)"/>
    <ellipse cx="70" cy="60" rx="26" ry="10" fill="#fff"/><ellipse cx="70" cy="60" rx="23.5" ry="8.2" fill="#c8202b"/>
    <text x="70" y="64" text-anchor="middle" font-family="Georgia,serif" font-weight="700" font-size="10" fill="#fff" letter-spacing="1">STAR</text>
    <text x="70" y="86" text-anchor="middle" font-family="Outfit,sans-serif" font-weight="600" font-size="7" fill="#fff">COCONUT OIL</text>
    <circle cx="56" cy="116" r="10" fill="#6b3e1d"/><circle cx="56" cy="116" r="6.5" fill="#fffaf0"/>
    <rect x="34" y="30" width="6" height="130" rx="3" fill="#fff" opacity=".2"/>
  </symbol>
</defs></svg>`;

function productVisual(p, cls = '') {
  const a = p.art;
  const vars = `--body:${a.body || '#5ba52e'};--cap:${a.cap || '#3f7d22'};--oil:${a.oil};--scale:${a.scale}`;
  return `<div class="pv ${cls}" style="${vars}">
    <svg viewBox="0 0 140 180" aria-hidden="true"><use href="#${a.sym}"/></svg>
    <img src="${p.img}" alt="Star Coconut Oil ${p.name}" draggable="false" onerror="this.remove()">
  </div>`;
}

/* ---------- Header (menu + centred logo) ---------- */
function renderHeader() {
  const here = location.pathname.split('/').pop() || 'index.html';
  const links = [
    ['index.html', 'Products'],
    ['story.html', 'Our Story'],
    ['story.html#process', 'How it\'s made'],
    ['contact.html', 'Contact Us'],
  ];
  const header = document.createElement('header');
  header.className = 'top';
  header.innerHTML = `
    <button class="menu-btn" aria-label="Open menu" aria-expanded="false" aria-controls="menu"><span></span><span></span><span></span></button>
    <a class="brand" href="index.html" aria-label="Star Pure Coconut Oil, home">
      <img src="assets/images/logo.svg" alt="Star" width="120" height="64">
      <svg class="brand__drip" viewBox="0 0 120 40" aria-hidden="true">
        <path d="M24 0H96C92 4 88 5 84 5C82 5 81 7 81 9V16A4 4 0 0 1 73 16V8C73 6 71 5 69 5C66 5 64 6 64 9V26A5 5 0 0 1 54 26V9C54 6 52 5 50 5C48 5 46 6 46 9V13A3.5 3.5 0 0 1 39 13V9C39 6 37 5 34 5C30 5 27 3 24 0Z"/>
        <circle class="brand__drop" cx="59" cy="34" r="3.2"/>
      </svg>
    </a>
    <nav class="menu" id="menu" aria-label="Main">
      ${links.map(([href, label]) => `<a href="${href}" ${href === here ? 'aria-current="page"' : ''}>${label}</a>`).join('')}
      <a class="menu__wa" href="${waLink('Hello Star Coconut Oil! I would like to place an order.')}" target="_blank" rel="noopener">Order on WhatsApp &nearr;</a>
    </nav>`;
  document.body.prepend(header);

  const btn = $('.menu-btn', header);
  const setOpen = (open) => {
    header.classList.toggle('is-open', open);
    btn.setAttribute('aria-expanded', open);
    btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  };
  btn.addEventListener('click', () => setOpen(!header.classList.contains('is-open')));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
  document.addEventListener('click', (e) => { if (!header.contains(e.target)) setOpen(false); });

  // slide the header away while scrolling down, back when scrolling up
  let lastY = scrollY;
  addEventListener('scroll', () => {
    const y = scrollY;
    if (Math.abs(y - lastY) < 6) return;
    header.classList.toggle('is-hidden', y > lastY && y > 160 && !header.classList.contains('is-open'));
    lastY = y;
  }, { passive: true });
}

/* ---------- Footer ---------- */
function renderFooter() {
  const el = $('footer[data-footer]');
  if (!el) return;
  el.className = 'foot';
  el.innerHTML = `
    <nav class="foot__nav" aria-label="Footer">
      <a href="index.html">Products</a><a href="story.html">Our Story</a><a href="story.html#process">How it's made</a><a href="contact.html">Contact Us</a>
      <a href="${waLink('Hello Star Coconut Oil!')}" target="_blank" rel="noopener">WhatsApp</a>
    </nav>
    <div class="foot__card">
      <p class="foot__label">Follow Star</p>
      <div class="foot__social">
        <a href="${SITE.instagram}" aria-label="Instagram"><svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="17.5" cy="6.5" r="1.3" fill="currentColor"/></svg></a>
        <a href="${SITE.facebook}" aria-label="Facebook"><svg viewBox="0 0 24 24"><path d="M14 8h3V4h-3a4 4 0 0 0-4 4v2H7v4h3v8h4v-8h3l1-4h-4V8z" fill="currentColor"/></svg></a>
        <a href="${waLink('Hello Star Coconut Oil!')}" target="_blank" rel="noopener" aria-label="WhatsApp"><svg viewBox="0 0 24 24"><path d="M12 3a9 9 0 0 0-7.8 13.5L3 21l4.6-1.2A9 9 0 1 0 12 3zm4.6 12.6c-.2.6-1.2 1.1-1.7 1.1-.4.1-1 .1-1.6-.1-.4-.1-.9-.3-1.5-.6-2.6-1.1-4.3-3.8-4.4-4-.1-.2-1-1.4-1-2.6s.6-1.8.9-2.1c.2-.2.5-.3.6-.3h.5c.2 0 .4 0 .6.4l.8 2c.1.2.1.3 0 .5l-.3.5-.4.4c-.1.1-.3.3-.1.6.2.3.7 1.2 1.5 1.9 1 .9 1.9 1.2 2.2 1.3.3.1.4.1.6-.1l.8-1c.2-.3.4-.2.6-.1l1.9.9c.3.1.5.2.5.3.1.2.1.7-.1 1.2z" fill="currentColor"/></svg></a>
      </div>
      <p class="foot__sign">Pure <span class="script">Kerala</span> goodness</p>
      <div class="foot__base">
        <p>&copy; ${new Date().getFullYear()} ${SITE.company}, Kannur, Kerala. All rights reserved.</p>
        <p>Star Extra Premium Coconut Oil &middot; Product of India</p>
      </div>
      <div class="foot__band" aria-hidden="true"><div>${('<span>Bulk &amp; wholesale orders welcome</span><b>&#10022;</b><span>Call or WhatsApp ' + SITE.phoneDisplay + '</span><b>&#10022;</b>').repeat(4)}</div></div>
    </div>`;
}

/* ---------- Golden oil curtain page transition ---------- */
function makeDrips() {
  // irregular drips hanging from the curtain's bottom edge
  const W = 1440, base = 26;
  let d = `M0 0L0 ${base}`, x = 0, gloss = '';
  let seed = 7;
  const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
  while (x < W - 60) {
    const gap = 40 + rnd() * 110;
    const w = 26 + rnd() * 34;
    const len = 50 + rnd() * 190;
    const c = x + gap + w / 2;
    if (c + w > W) break;
    const s = w * 0.3, r = w * 0.38, y1 = base + len;
    d += `L${c - w / 2 - 14} ${base}C${c - w / 2} ${base} ${c - s} ${base + 6} ${c - s} ${base + 22}`
       + `L${c - s} ${y1}A${r} ${r} 0 1 0 ${c + s} ${y1}`
       + `L${c + s} ${base + 22}C${c + s} ${base + 6} ${c + w / 2} ${base} ${c + w / 2 + 14} ${base}`;
    gloss += `<rect x="${c - s * 0.55}" y="${base + 18}" width="${Math.max(3, w * 0.09)}" height="${len * 0.75}" rx="3"/>`;
    x = c + w / 2 + 14;
  }
  d += `L${W} ${base}L${W} 0Z`;
  $$('.curtain__drips').forEach((svg) => {
    svg.innerHTML = `<path d="${d}"/><g class="curtain__gloss">${gloss}</g>`;
  });
}

function initCurtain() {
  const curtain = $('.curtain');
  if (!curtain) return;
  makeDrips();
  const root = document.documentElement;

  // arriving via the curtain: lift it off this page
  if (root.classList.contains('oil-in')) {
    store.del('oil');
    requestAnimationFrame(() => requestAnimationFrame(() => {
      root.classList.remove('oil-in');
      curtain.classList.add('is-leaving');
      document.dispatchEvent(new CustomEvent('page:revealed'));
    }));
  } else {
    requestAnimationFrame(() => document.dispatchEvent(new CustomEvent('page:pending')));
  }

  window.goTo = (url, label) => {
    if (reduceMotion) { location.href = url; return; }
    if (label) $('.curtain__text', curtain).innerHTML = label;
    curtain.classList.remove('is-leaving');
    void curtain.offsetWidth;
    curtain.classList.add('is-covering');
    store.set('oil', '1');
    setTimeout(() => { location.href = url; }, 1050);
  };

  // internal links pour the curtain too
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    if (!a || a.target === '_blank' || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    const href = a.getAttribute('href');
    if (/^(https?:|mailto:|tel:|#)/.test(href)) return;
    const [path, hash] = href.split('#');
    const herePath = location.pathname.split('/').pop() || 'index.html';
    if ((path || herePath) === herePath && hash !== undefined) return; // same-page anchor
    e.preventDefault();
    window.goTo(href);
  });

  // back/forward cache: never leave a page covered
  window.addEventListener('pageshow', (e) => {
    if (e.persisted) { curtain.classList.remove('is-covering'); curtain.classList.add('is-leaving'); }
  });
}

/* ---------- Scroll reveal ---------- */
function initReveal() {
  const els = $$('[data-reveal]');
  if (!('IntersectionObserver' in window)) { els.forEach((e) => e.classList.add('is-in')); return; }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      en.target.classList.add('is-in');
      io.unobserve(en.target);
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
  els.forEach((e) => io.observe(e));
}

/* ---------- Golden cursor ---------- */
function initCursor() {
  if (!finePointer || reduceMotion) return;
  const dot = document.createElement('div');
  dot.className = 'cursor';
  dot.setAttribute('aria-hidden', 'true');
  document.body.append(dot);
  let x = -100, y = -100, cx = x, cy = y;
  window.addEventListener('pointermove', (e) => { x = e.clientX; y = e.clientY; dot.classList.add('is-on'); }, { passive: true });
  document.addEventListener('pointerleave', () => dot.classList.remove('is-on'));
  document.addEventListener('pointerover', (e) => {
    dot.classList.toggle('is-big', !!e.target.closest('a, button, [data-hover], input, select, textarea'));
  });
  const loop = () => {
    cx += (x - cx) * 0.2; cy += (y - cy) * 0.2;
    dot.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
    requestAnimationFrame(loop);
  };
  loop();
}

document.addEventListener('DOMContentLoaded', () => {
  document.body.insertAdjacentHTML('afterbegin', SPRITE);
  renderHeader();
  renderFooter();
  initCurtain();
  initReveal();
  initCursor();
  $$('.js-phone').forEach((el) => { el.textContent = SITE.phoneDisplay; el.href = `tel:+${SITE.whatsapp}`; });
});
