/* ==========================================================
   Home: loader + 3D product carousel
   ========================================================== */

function runLoader(onDone) {
  const loader = $('.loader');
  const arrivedByCurtain = document.documentElement.classList.contains('oil-in');
  if (arrivedByCurtain || reduceMotion || store.get('loaded')) {
    loader.classList.add('is-skipped');
    onDone();
    return;
  }
  const nums = $$('.loader__pct span', loader);
  const sources = ['assets/images/logo.svg', ...PRODUCTS.map((p) => p.img)];
  let loaded = 0;
  const total = sources.length + 1;
  sources.forEach((src) => {
    const im = new Image();
    im.onload = im.onerror = () => { loaded++; };
    im.src = src;
  });
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => { loaded++; });

  const t0 = performance.now(), MIN = 1700, MAX = 6000;
  let shown = 0;
  const tick = (now) => {
    const el = now - t0;
    const goal = el > MAX ? 100 : Math.min(loaded / total, el / MIN) * 100;
    shown += (goal - shown) * 0.08 + 0.15;
    shown = Math.min(shown, 100);
    loader.style.setProperty('--p', shown.toFixed(2));
    nums.forEach((n) => { n.textContent = Math.floor(shown); });
    if (shown < 100) { requestAnimationFrame(tick); return; }
    store.set('loaded', '1');
    setTimeout(() => { loader.classList.add('is-done'); onDone(); }, 250);
  };
  requestAnimationFrame(tick);
}

function initCarousel() {
  const stage = $('.stage');
  const track = $('.names__track');
  const live = $('#live');
  const N = PRODUCTS.length;
  const wrap = (v) => ((v % N) + N) % N;

  // start on the product the visitor came back from, if any
  const fromId = store.get('lastProduct');
  let target = Math.max(0, PRODUCTS.findIndex((p) => p.id === fromId));
  let pos = target - 2.6; // swoosh in on load
  let spacing = 400, step = 340;
  let dragging = false;
  const mouse = { x: 0, y: 0, sx: 0, sy: 0 };

  const items = PRODUCTS.map((p, i) => {
    const el = document.createElement('div');
    el.className = 'item';
    el.dataset.index = i;
    el.setAttribute('role', 'group');
    el.setAttribute('aria-roledescription', 'slide');
    el.setAttribute('aria-label', `${p.name}, ${p.kicker}`);
    el.innerHTML = `<div class="item__float" style="--fd:${(i * -1.1).toFixed(1)}s">${productVisual(p)}</div>
      <div class="item__shadow"></div><span class="item__cta">Explore</span>`;
    stage.append(el);
    return el;
  });

  const names = [];
  for (let j = -2 * N; j < 3 * N; j++) {
    const p = PRODUCTS[wrap(j)];
    const b = document.createElement('button');
    b.className = 'name';
    b.style.setProperty('--j', j);
    b.dataset.j = j;
    b.tabIndex = -1;
    b.innerHTML = `${p.name}<small>${p.kicker}</small>`;
    b.addEventListener('click', () => {
      if (Math.round(pos) === j) open(); else target = j;
    });
    track.append(b);
    names.push(b);
  }

  const measure = () => {
    const w = window.innerWidth;
    spacing = w < 700 ? w * 0.6 : clamp(w * 0.3, 300, 560);
    step = parseFloat(getComputedStyle($('.names')).getPropertyValue('--step')) || 340;
    if (String(getComputedStyle($('.names')).getPropertyValue('--step')).includes('vw')) step = w * 0.64;
  };
  measure();
  window.addEventListener('resize', () => { measure(); });

  const offsetFor = (i) => {
    let o = i - wrap(pos);
    if (o > N / 2) o -= N;
    if (o < -N / 2) o += N;
    return o;
  };

  let lastActive = -1, lastKey = '';
  // Phones: changing a blur every frame makes the GPU re-blur large images 60x a second,
  // so side packs just fade there. Desktops keep the depth-of-field blur.
  const useBlur = finePointer && !reduceMotion;
  const render = () => {
    // skip all style writes while the carousel is at rest
    const key = `${pos.toFixed(4)}|${mouse.sx.toFixed(3)}|${mouse.sy.toFixed(3)}|${spacing}|${step}`;
    if (key === lastKey) return;
    lastKey = key;
    items.forEach((el, i) => {
      const o = offsetFor(i);
      const a = Math.abs(o);
      const c = Math.max(0, 1 - a);
      const x = o * spacing;
      const z = -a * 280;
      const ry = o * -24 + mouse.sx * 16 * c;
      const rx = -mouse.sy * 10 * c;
      const rz = o * 2.5;
      const sc = 1 - Math.min(a, 2) * 0.07;
      const blur = Math.min(a, 2.2) * 3.4;
      el.style.transform = `translate(-50%, -50%) translate3d(${x.toFixed(1)}px, ${(a * 14).toFixed(1)}px, ${z.toFixed(1)}px) rotateY(${ry.toFixed(2)}deg) rotateX(${rx.toFixed(2)}deg) rotateZ(${rz.toFixed(2)}deg) scale(${sc.toFixed(3)})`;
      if (useBlur) el.style.filter = blur > 0.2 ? `blur(${blur.toFixed(1)}px) saturate(${(1 - a * 0.12).toFixed(2)})` : 'none';
      const fade = useBlur ? 1 : 1 - Math.min(a, 2) * 0.22;
      el.style.opacity = (clamp((N / 2 - a) / 0.45, 0, 1) * fade).toFixed(3);
      el.style.zIndex = 100 - Math.round(a * 10);
      el.classList.toggle('is-center', a < 0.35);
    });
    track.style.transform = `translateX(${(-pos * step).toFixed(1)}px)`;
    const active = Math.round(pos);
    if (active !== lastActive) {
      names.forEach((b) => b.classList.toggle('is-active', +b.dataset.j === active));
      lastActive = active;
      const p = PRODUCTS[wrap(active)];
      live.textContent = `${p.name}, ${p.kicker}`;
    }
  };

  let lastT = performance.now();
  const loop = (now = performance.now()) => {
    const dt = Math.min(0.1, (now - lastT) / 1000);
    lastT = now;
    // time-based easing so it feels the same on fast and slow screens
    if (!dragging) {
      pos += (target - pos) * (reduceMotion ? 1 : 1 - Math.exp(-dt * 5.5));
      if (Math.abs(target - pos) < 0.0004) pos = target; // settle exactly so render() can rest
    }
    // keep numbers small; visuals are periodic so this jump is invisible
    if (target >= N && pos >= N - 0.5) { target -= N; pos -= N; lastActive = -99; }
    if (target < 0 && pos < -0.5) { target += N; pos += N; lastActive = -99; }
    const k = 1 - Math.exp(-dt * 4.5);
    mouse.sx += (mouse.x - mouse.sx) * k;
    mouse.sy += (mouse.y - mouse.sy) * k;
    if (Math.abs(mouse.x - mouse.sx) < 0.001) mouse.sx = mouse.x;
    if (Math.abs(mouse.y - mouse.sy) < 0.001) mouse.sy = mouse.y;
    render();
    requestAnimationFrame(loop);
  };

  const current = () => PRODUCTS[wrap(Math.round(target))];
  const open = () => {
    const p = current();
    store.set('lastProduct', p.id);
    window.goTo(`product.html?p=${p.id}`);
  };
  const go = (d) => { target = Math.round(target) + d; };

  // mouse tilt
  window.addEventListener('pointermove', (e) => {
    mouse.x = (e.clientX / window.innerWidth - 0.5) * 2;
    mouse.y = (e.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });

  // wheel / trackpad
  let acc = 0, lockUntil = 0, accTimer = 0;
  window.addEventListener('wheel', (e) => {
    e.preventDefault();
    const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    acc += d;
    clearTimeout(accTimer);
    accTimer = setTimeout(() => { acc = 0; }, 180);
    const now = performance.now();
    if (Math.abs(acc) > 40 && now > lockUntil) {
      go(Math.sign(acc));
      acc = 0;
      lockUntil = now + 520;
    }
  }, { passive: false });

  // drag / swipe, and click
  let startX = 0, startPos = 0, moved = 0, lastX = 0, lastMoveT = 0, vel = 0, downItem = null;
  stage.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    dragging = true; moved = 0;
    startX = lastX = e.clientX; startPos = pos; lastMoveT = performance.now(); vel = 0;
    downItem = e.target.closest('.item');
    stage.setPointerCapture(e.pointerId);
    stage.classList.add('is-dragging');
  });
  stage.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - startX;
    moved = Math.max(moved, Math.abs(dx));
    pos = startPos - dx / spacing;
    const now = performance.now();
    vel = (e.clientX - lastX) / Math.max(1, now - lastMoveT);
    lastX = e.clientX; lastMoveT = now;
  });
  const end = () => {
    if (!dragging) return;
    dragging = false;
    stage.classList.remove('is-dragging');
    if (moved < 6) {
      if (downItem) {
        const o = Math.round(offsetFor(+downItem.dataset.index));
        if (o === 0) open(); else target = Math.round(pos) + o;
      }
      pos = startPos;
      return;
    }
    const fling = clamp(-vel * 0.9, -2, 2);
    target = Math.round(pos + fling);
  };
  stage.addEventListener('pointerup', end);
  stage.addEventListener('pointercancel', end);

  $('.arrow--prev').addEventListener('click', () => go(-1));
  $('.arrow--next').addEventListener('click', () => go(1));
  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') go(1);
    else if (e.key === 'ArrowLeft') go(-1);
    else if (e.key === 'Enter' && document.activeElement === stage) open();
  });

  loop();
}

document.addEventListener('DOMContentLoaded', () => {
  initOil($('.home__oil'), { pointerTarget: $('.home') });
  runLoader(() => {
    document.body.classList.add('is-ready');
    initCarousel();
  });
});
