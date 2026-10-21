/* ==========================================================
   Star Pack Studio
   Builds the Star packs as real 3D models (three.js) with labels drawn in code,
   and renders them as transparent images for the website.

   window.renderPack(id, width, height) -> PNG data URL  (used by the render script)
   ========================================================== */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ---- Packs (sizes are relative; 1 unit ≈ the 5 L can's height) -----------------------
const PACKS = {
  '5l-can':      { label: '5 L can',      type: 'jug',   vol: '5 L',    volLong: '5 Litre', sx: 1,    sy: 1.06,    depth: 0.34, shell: 'yellow', cap: '#f2bd00' },
  // the 2 L is the same bottle as the 1 L, only bigger (the site scales the 1 L down to 0.86)
  '2l-bottle':   { label: '2 L bottle',   type: 'jug',   vol: '2 L',    volLong: '2 Litre', sx: 0.6,  sy: 1.1,  depth: 0.19, shell: 'clear',  cap: '#d3222a' },
  '1l-bottle':   { label: '1 L bottle',   type: 'jug',   vol: '1 L',    volLong: '1 Litre', sx: 0.6,  sy: 1.1,  depth: 0.19, shell: 'clear',  cap: '#d3222a' },
  '1l-pouch':    { label: '1 L pouch',    type: 'pouch', vol: '1 L',    volLong: '1 Litre', w: 0.62, h: 0.92 },
  '500ml-pouch': { label: '500 ml pouch', type: 'pouch', vol: '500 ml', volLong: '500 ml',  w: 0.5,  h: 0.76 },
};
const VIEW_ANGLE = { jug: -0.42, pouch: -0.34 };   // turn so the side shows (handle side for jugs)
const LOGO_URL = '../../assets/images/logo.svg';

// ---- Small helpers --------------------------------------------------------------------
function rng(seed) { // deterministic "random" so every render is identical
  return () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
const loadImage = (src) => new Promise((ok, fail) => { const i = new Image(); i.onload = () => ok(i); i.onerror = fail; i.src = src; });

// ---- Label artwork (Canvas 2D) --------------------------------------------------------
function frond(ctx, x, y, ang, len, width, color) {
  ctx.save();
  ctx.translate(x, y); ctx.rotate(ang);
  ctx.strokeStyle = color; ctx.lineCap = 'round';
  ctx.lineWidth = width * 0.1;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(len * 0.5, -len * 0.16, len, len * 0.06); ctx.stroke();
  for (let i = 1; i <= 22; i++) {
    const t = i / 23;
    const px = len * t;
    const py = 2 * t * (1 - t) * (-len * 0.16) + t * t * len * 0.06;
    const L = width * (1 - t * 0.65);
    ctx.lineWidth = width * 0.07 * (1 - t * 0.5);
    ctx.beginPath(); ctx.moveTo(px, py); ctx.quadraticCurveTo(px + L * 0.25, py - L * 0.55, px + L * 0.6, py - L); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(px, py); ctx.quadraticCurveTo(px + L * 0.3, py + L * 0.4, px + L * 0.65, py + L * 0.8); ctx.stroke();
  }
  ctx.restore();
}

function wholeCoconut(ctx, x, y, r, rand) {
  const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.1, x, y, r);
  g.addColorStop(0, '#9b6233'); g.addColorStop(0.6, '#6b3d1a'); g.addColorStop(1, '#3d220c');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  ctx.save(); ctx.clip();
  ctx.strokeStyle = 'rgba(30, 14, 4, .35)'; ctx.lineWidth = Math.max(1, r * 0.018);
  for (let i = 0; i < 70; i++) { // husk fibres
    const a = rand() * Math.PI * 2, rr = r * (0.3 + rand() * 0.8);
    ctx.beginPath(); ctx.arc(x, y, rr, a, a + 0.3 + rand() * 0.5); ctx.stroke();
  }
  ctx.restore();
  ctx.fillStyle = '#2b1606'; // the three "eyes"
  [[-0.18, -0.2], [0.05, -0.28], [-0.02, -0.08]].forEach(([dx, dy]) => { ctx.beginPath(); ctx.arc(x + dx * r, y + dy * r, r * 0.06, 0, Math.PI * 2); ctx.fill(); });
}

function coconutHalf(ctx, x, y, r, tilt, rand) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(tilt);
  let g = ctx.createRadialGradient(-r * 0.3, r * 0.4, r * 0.1, 0, r * 0.2, r * 1.1);
  g.addColorStop(0, '#a3683a'); g.addColorStop(0.55, '#6e3f1b'); g.addColorStop(1, '#341b07');
  ctx.fillStyle = g; // shell, lower dome
  ctx.beginPath(); ctx.ellipse(0, 0, r, r * 0.92, 0, 0, Math.PI); ctx.closePath(); ctx.fill();
  ctx.save(); ctx.clip();
  ctx.strokeStyle = 'rgba(30, 14, 4, .3)'; ctx.lineWidth = Math.max(1, r * 0.016);
  for (let i = 0; i < 50; i++) { const a = rand() * Math.PI, rr = r * (0.4 + rand() * 0.7); ctx.beginPath(); ctx.arc(0, -r * 0.1, rr, a, a + 0.25 + rand() * 0.4); ctx.stroke(); }
  ctx.restore();
  ctx.fillStyle = '#4a2810'; ctx.beginPath(); ctx.ellipse(0, 0, r, r * 0.3, 0, 0, Math.PI * 2); ctx.fill();          // shell rim
  g = ctx.createLinearGradient(0, -r * 0.3, 0, r * 0.3);
  g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#efe6d0');
  ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, -r * 0.01, r * 0.9, r * 0.255, 0, 0, Math.PI * 2); ctx.fill();     // white flesh
  g = ctx.createRadialGradient(-r * 0.15, 0, r * 0.05, 0, r * 0.02, r * 0.75);
  g.addColorStop(0, '#f6efdd'); g.addColorStop(1, '#d6c8a6');
  ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, r * 0.015, r * 0.7, r * 0.18, 0, 0, Math.PI * 2); ctx.fill();     // hollow
  ctx.restore();
}

function oilCarafe(ctx, cx, bottom, h) {
  const w = h * 0.56, neckW = w * 0.3, neckH = h * 0.3, bodyH = h - neckH;
  ctx.save();
  // glass outline
  ctx.beginPath();
  ctx.moveTo(cx - neckW / 2, bottom - h);
  ctx.lineTo(cx - neckW / 2, bottom - bodyH);
  ctx.bezierCurveTo(cx - w * 0.62, bottom - bodyH * 0.8, cx - w * 0.56, bottom, cx - w * 0.2, bottom);
  ctx.lineTo(cx + w * 0.2, bottom);
  ctx.bezierCurveTo(cx + w * 0.56, bottom, cx + w * 0.62, bottom - bodyH * 0.8, cx + neckW / 2, bottom - bodyH);
  ctx.lineTo(cx + neckW / 2, bottom - h);
  ctx.closePath();
  ctx.fillStyle = 'rgba(255, 255, 255, .35)'; ctx.fill();
  ctx.save(); ctx.clip();
  const g = ctx.createLinearGradient(cx - w / 2, 0, cx + w / 2, 0);
  g.addColorStop(0, '#d99a1e'); g.addColorStop(0.35, '#ffe48a'); g.addColorStop(0.7, '#f2c044'); g.addColorStop(1, '#c98614');
  ctx.fillStyle = g; ctx.fillRect(cx - w, bottom - bodyH * 0.82, w * 2, bodyH);  // oil
  ctx.fillStyle = 'rgba(255, 250, 220, .6)'; ctx.fillRect(cx - w, bottom - bodyH * 0.82, w * 2, Math.max(2, h * 0.012)); // surface glint
  ctx.restore();
  ctx.lineWidth = Math.max(1.5, h * 0.012); ctx.strokeStyle = 'rgba(255, 255, 255, .85)'; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx - w * 0.3, bottom - bodyH * 0.6); ctx.quadraticCurveTo(cx - w * 0.38, bottom - bodyH * 0.3, cx - w * 0.22, bottom - bodyH * 0.12);
  ctx.lineWidth = Math.max(2, h * 0.03); ctx.strokeStyle = 'rgba(255, 255, 255, .7)'; ctx.stroke(); // highlight
  ctx.fillStyle = '#8a5a2b'; roundRect(ctx, cx - neckW * 0.62, bottom - h - h * 0.07, neckW * 1.24, h * 0.09, h * 0.02); ctx.fill(); // cork
  ctx.restore();
}

function volumeBadge(ctx, x, y, r, vol) {
  ctx.save();
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
  g.addColorStop(0, '#f0413f'); g.addColorStop(1, '#b3141d');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r * 0.88, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff6e0'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = `700 ${r * 0.22}px Outfit`; ctx.letterSpacing = `${r * 0.02}px`;
  ctx.fillText('NET VOL.', x, y - r * 0.36);
  ctx.letterSpacing = '0px';
  let f = r * (vol.length > 3 ? 0.5 : 0.7);
  ctx.font = `900 ${f}px Outfit`;
  while (ctx.measureText(vol).width > r * 1.5) { f *= 0.94; ctx.font = `900 ${f}px Outfit`; }
  ctx.fillText(vol, x, y + r * 0.14);
  ctx.restore();
}

function fitText(ctx, text, weight, size, maxW) {
  ctx.font = `${weight} ${size}px Outfit`;
  while (ctx.measureText(text).width > maxW && size > 6) { size *= 0.95; ctx.font = `${weight} ${size}px Outfit`; }
  return size;
}

// The main label panel, shared by jugs and pouches. (x, y, W, H) = panel area on the canvas.
function drawPanel(ctx, logo, pack, x, y, W, H, seed) {
  const rand = rng(seed);
  ctx.save();
  ctx.translate(x, y);
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#fbf7ea'); bg.addColorStop(0.45, '#eef5dc'); bg.addColorStop(0.78, '#a9d47a'); bg.addColorStop(1, '#4f9a2a');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

  // soft palm fronds behind everything
  const m = Math.min(W, H);
  frond(ctx, -m * 0.05, -m * 0.02, 0.55, m * 0.75, m * 0.16, 'rgba(79, 154, 42, .28)');
  frond(ctx, W + m * 0.05, -m * 0.04, Math.PI - 0.6, m * 0.7, m * 0.15, 'rgba(79, 154, 42, .22)');
  frond(ctx, -m * 0.1, H * 0.62, -0.25, m * 0.6, m * 0.12, 'rgba(255, 255, 255, .25)');

  // logo
  const lw = Math.min(W * 0.62, (H * 0.36) * (174 / 136));
  const lh = lw * 136 / 174;
  ctx.drawImage(logo, (W - lw) / 2, H * 0.04, lw, lh);

  // name
  let ty = H * 0.04 + lh + H * 0.05;
  ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  let f = fitText(ctx, 'EXTRA PREMIUM', 700, Math.min(W * 0.05, H * 0.04), W * 0.8);
  ctx.letterSpacing = `${f * 0.22}px`;
  ctx.fillStyle = '#3d7a1e'; ctx.fillText('EXTRA PREMIUM', W / 2, ty);
  ctx.letterSpacing = '0px';
  ty += f * 0.4;
  f = fitText(ctx, 'COCONUT OIL', 900, Math.min(W * 0.13, H * 0.1), W * 0.88);
  ty += f;
  ctx.fillStyle = '#3a2008'; ctx.fillText('COCONUT OIL', W / 2, ty);

  // illustration: coconuts + oil carafe, and the volume badge
  const base = H * 0.93;
  const s = Math.min(W * 0.95, (base - ty - H * 0.02) * 1.6);
  wholeCoconut(ctx, W * 0.24, base - s * 0.2, s * 0.17, rand);
  coconutHalf(ctx, W * 0.36, base - s * 0.1, s * 0.2, -0.12, rand);
  oilCarafe(ctx, W * 0.62, base, s * 0.5);
  volumeBadge(ctx, W * 0.84, base - s * 0.42, Math.min(s * 0.15, W * 0.13), pack.vol);

  ctx.font = `600 ${Math.min(W * 0.03, H * 0.03)}px Outfit`; ctx.fillStyle = '#ffffff';
  ctx.letterSpacing = '1px';
  ctx.fillText(`${pack.volLong.toUpperCase()}  ·  PRODUCT OF INDIA`, W / 2, H * 0.985);
  ctx.letterSpacing = '0px';
  ctx.restore();
}

function crimpBand(ctx, y, W, h) {
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, '#c9ced2'); g.addColorStop(0.45, '#ffffff'); g.addColorStop(1, '#aab1b7');
  ctx.fillStyle = g; ctx.fillRect(0, y, W, h);
  ctx.fillStyle = 'rgba(0, 0, 0, .09)';
  for (let x = 0; x < W; x += 9) ctx.fillRect(x, y, 3, h);  // heat-seal ridges
}

async function labelCanvas(pack, logo, kind, W, H) {
  const c = document.createElement('canvas');
  c.width = Math.round(W); c.height = Math.round(H);
  const ctx = c.getContext('2d');
  if (kind === 'jug') {
    roundRect(ctx, 0, 0, c.width, c.height, c.width * 0.06); ctx.clip();
    drawPanel(ctx, logo, pack, 0, 0, c.width, c.height, 7);
  } else if (kind === 'pouch-front') {
    const top = c.height * 0.08, bot = c.height * 0.065;
    drawPanel(ctx, logo, pack, 0, top, c.width, c.height - top - bot, 11);
    crimpBand(ctx, 0, c.width, top);
    crimpBand(ctx, c.height - bot, c.width, bot);
  } else { // pouch back: plain green with fronds
    const g = ctx.createLinearGradient(0, 0, 0, c.height);
    g.addColorStop(0, '#e9f3d6'); g.addColorStop(1, '#5aa532');
    ctx.fillStyle = g; ctx.fillRect(0, 0, c.width, c.height);
    frond(ctx, 0, c.height * 0.2, 0.3, c.width * 0.9, c.width * 0.2, 'rgba(79, 154, 42, .3)');
    crimpBand(ctx, 0, c.width, c.height * 0.08);
    crimpBand(ctx, c.height * 0.935, c.width, c.height * 0.065);
  }
  return c;
}

function toTexture(canvas, renderer) {
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return t;
}

// ---- Geometry -------------------------------------------------------------------------
// Front outline of a jerrycan / jug body: sloped shoulder that dips under the handle.
function jugBodyShape(sx, sy) {
  const s = new THREE.Shape();
  const P = (x, y) => [x * sx, y * sy];
  s.moveTo(...P(-0.38, 0.07));
  s.lineTo(...P(-0.38, 0.68));
  s.quadraticCurveTo(...P(-0.38, 0.8), ...P(-0.27, 0.8));
  s.lineTo(...P(-0.1, 0.8));
  s.quadraticCurveTo(...P(0.12, 0.66), ...P(0.3, 0.66));
  s.quadraticCurveTo(...P(0.4, 0.66), ...P(0.4, 0.56));
  s.lineTo(...P(0.4, 0.07));
  s.quadraticCurveTo(...P(0.4, 0), ...P(0.33, 0));
  s.lineTo(...P(-0.31, 0));
  s.quadraticCurveTo(...P(-0.38, 0), ...P(-0.38, 0.07));
  return s;
}

// The carry handle: a loop rising from the body, thinner than the body (extruded separately).
function jugHandleShape(sx, sy) {
  const s = new THREE.Shape();
  const P = (x, y) => [x * sx, y * sy];
  s.moveTo(...P(-0.06, 0.64));
  s.lineTo(...P(-0.06, 0.8));
  s.quadraticCurveTo(...P(-0.02, 1.0), ...P(0.2, 1.0));
  s.quadraticCurveTo(...P(0.4, 1.0), ...P(0.4, 0.78));
  s.lineTo(...P(0.4, 0.64));
  s.lineTo(...P(-0.06, 0.64));
  const hole = new THREE.Path();
  hole.absellipse(0.2 * sx, 0.8 * sy, 0.1 * sx, 0.108 * sy, 0, Math.PI * 2, true);
  s.holes.push(hole);
  return s;
}

function roundedRectShape(cx, cy, w, h, r) {
  const s = new THREE.Shape();
  const x = cx - w / 2, y = cy - h / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

function normalizeUVs(geo) { // ShapeGeometry uses raw x/y as UVs; map them to 0..1
  geo.computeBoundingBox();
  const { min, max } = geo.boundingBox, pos = geo.attributes.position, uv = geo.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (pos.getX(i) - min.x) / (max.x - min.x), (pos.getY(i) - min.y) / (max.y - min.y));
  uv.needsUpdate = true;
}

function ribbedCap(r, h, color) {
  const g = new THREE.CylinderGeometry(r, r, h, 128, 4);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i), y = p.getY(i);
    const rad = Math.hypot(x, z);
    if (rad > r * 0.98 && Math.abs(y) < h / 2 - 0.0001) { // ridges on the side only
      const a = Math.atan2(z, x), k = 1 + 0.035 * Math.max(0, Math.cos(a * 36));
      p.setX(i, x * k); p.setZ(i, z * k);
    }
  }
  g.computeVertexNormals();
  const mat = new THREE.MeshPhysicalMaterial({ color, roughness: 0.42, clearcoat: 0.4, clearcoatRoughness: 0.3 });
  const cap = new THREE.Group();
  cap.add(new THREE.Mesh(g, mat));
  const top = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.92, r, h * 0.12, 96), mat);
  top.position.y = h / 2 + h * 0.06;
  cap.add(top);
  const band = new THREE.Mesh(new THREE.TorusGeometry(r * 1.0, h * 0.09, 16, 96), mat);
  band.rotation.x = Math.PI / 2; band.position.y = -h / 2;
  cap.add(band);
  return cap;
}

async function buildJug(pack, logo, renderer) {
  const { sx, sy, depth } = pack;
  const group = new THREE.Group();
  const bevelT = 0.05 * Math.min(1, depth / 0.3), bevelS = 0.042 * Math.min(1, sx + 0.1);
  const geo = new THREE.ExtrudeGeometry(jugBodyShape(sx, sy), {
    depth, bevelEnabled: true, bevelThickness: bevelT, bevelSize: bevelS, bevelSegments: 12, curveSegments: 72,
  });
  geo.translate(0, 0, -depth / 2);
  geo.computeVertexNormals();
  const hDepth = depth * 0.3, hBevel = Math.min(0.045, depth * 0.22);
  const handleGeo = new THREE.ExtrudeGeometry(jugHandleShape(sx, sy), {
    depth: hDepth, bevelEnabled: true, bevelThickness: hBevel, bevelSize: hBevel * 0.75, bevelSegments: 14, curveSegments: 72,
  });
  handleGeo.translate(0, 0, -hDepth / 2);
  handleGeo.computeVertexNormals();

  const clear = pack.shell === 'clear';
  const shellMat = clear
    ? new THREE.MeshPhysicalMaterial({ color: '#f4f1e8', roughness: 0.3, transparent: true, opacity: 0.5, clearcoat: 0.8, clearcoatRoughness: 0.15, depthWrite: false })
    : new THREE.MeshPhysicalMaterial({ color: '#f5c000', roughness: 0.34, clearcoat: 0.7, clearcoatRoughness: 0.2 });
  const shell = new THREE.Mesh(geo, shellMat);
  shell.renderOrder = 2;
  group.add(shell);
  const handle = new THREE.Mesh(handleGeo, shellMat);
  handle.renderOrder = 2;
  group.add(handle);

  if (clear) { // oil inside, seen through the plastic
    const oilShape = roundedRectShape(0.01 * sx, 0.31 * sy, 0.74 * sx, 0.58 * sy, 0.06 * sx); // fill level just under the shoulder
    const oilGeo = new THREE.ExtrudeGeometry(oilShape, { depth: depth + bevelT * 1.2, bevelEnabled: true, bevelThickness: bevelT * 0.4, bevelSize: bevelS * 0.6, bevelSegments: 6, curveSegments: 24 });
    oilGeo.translate(0, 0, -(depth + bevelT * 1.2) / 2);
    const oil = new THREE.Mesh(oilGeo, new THREE.MeshPhysicalMaterial({
      color: '#f1c54f', roughness: 0.15, transparent: true, opacity: 0.92, emissive: '#5a3a00', emissiveIntensity: 0.15, clearcoat: 1,
    }));
    oil.renderOrder = 1;
    group.add(oil);
  }

  // neck + cap on the left shoulder
  const neckR = 0.068 * Math.max(sx, 0.78), neckX = -0.19 * sx, shoulderY = 0.8 * sy;
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(neckR, neckR * 1.15, 0.06, 64), shellMat);
  neck.position.set(neckX, shoulderY + 0.03, 0);
  neck.renderOrder = 2;
  group.add(neck);
  const capH = 0.075, cap = ribbedCap(neckR * 1.2, capH, pack.cap);
  cap.position.set(neckX, shoulderY + 0.06 + capH / 2, 0);
  group.add(cap);
  group.userData.mouth = new THREE.Vector3(neckX, shoulderY + 0.06 + capH * 1.12, 0); // top of the cap

  // label on the front face
  const lw = 0.62 * sx, lh = 0.44 * sy;
  const labelGeo = new THREE.ShapeGeometry(roundedRectShape(0.01 * sx, 0.31 * sy, lw, lh, 0.035), 24);
  normalizeUVs(labelGeo);
  const px = 2400;
  const tex = toTexture(await labelCanvas(pack, logo, 'jug', lw * px, lh * px), renderer);
  const label = new THREE.Mesh(labelGeo, new THREE.MeshPhysicalMaterial({
    map: tex, roughness: 0.38, clearcoat: 0.6, clearcoatRoughness: 0.18, polygonOffset: true, polygonOffsetFactor: -2,
  }));
  label.position.z = depth / 2 + bevelT + 0.0015;
  label.renderOrder = 3;
  group.add(label);

  group.position.y = -0.5 * sy;
  return group;
}

function pouchGeometry(w, h, puff, side) {
  const g = new THREE.PlaneGeometry(w, h, 80, 120);
  const p = g.attributes.position;
  const sealTop = 0.08, sealBot = 0.065;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i);
    const u = (2 * x) / w;
    const t = (y + h / 2) / h;                          // 0 bottom .. 1 top
    const inner = (t - sealBot) / (1 - sealTop - sealBot); // 0..1 inside the seals
    let z = 0;
    if (inner > 0 && inner < 1) {
      const v = inner * 2 - 1;
      const f = Math.max(0, (1 - Math.abs(u) ** 4) * (1 - Math.abs(v) ** 4));
      const sag = 1.15 - 0.3 * inner;                   // oil settles: fuller at the bottom
      z = puff * f * sag + 0.0025 * Math.sin(x * 60 + y * 25) * f; // faint film wrinkles
    }
    p.setZ(i, z * side);
  }
  if (side < 0) { g.scale(-1, 1, 1); } // back face: mirror so it faces -z with correct winding
  g.computeVertexNormals();
  return g;
}

async function buildPouch(pack, logo, renderer) {
  const { w, h } = pack;
  const group = new THREE.Group();
  const px = 2400;
  const front = toTexture(await labelCanvas(pack, logo, 'pouch-front', w * px, h * px), renderer);
  const back = toTexture(await labelCanvas(pack, logo, 'pouch-back', w * px * 0.5, h * px * 0.5), renderer);
  const film = { roughness: 0.26, metalness: 0.08, clearcoat: 1, clearcoatRoughness: 0.08 };
  const puff = w * 0.12;
  group.add(new THREE.Mesh(pouchGeometry(w, h, puff, 1), new THREE.MeshPhysicalMaterial({ map: front, ...film })));
  const backMesh = new THREE.Mesh(pouchGeometry(w, h, puff, -1), new THREE.MeshPhysicalMaterial({ map: back, ...film }));
  group.add(backMesh);
  group.userData.mouth = new THREE.Vector3(0, h / 2, 0); // pours from the top seal
  return group;
}

// ---- Scene ----------------------------------------------------------------------------
function makeScene(renderer) {
  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.85;
  const key = new THREE.DirectionalLight('#fff4e0', 2.0); key.position.set(2.5, 4, 5); scene.add(key);
  const fill = new THREE.DirectionalLight('#fff', 0.5); fill.position.set(-4, 1, 3); scene.add(fill);
  const rim = new THREE.DirectionalLight('#ffe7b0', 1.4); rim.position.set(-2, 3, -4); scene.add(rim);
  return scene;
}

function setupRenderer(canvas, w, h, alpha) {
  const r = new THREE.WebGLRenderer({ canvas, antialias: true, alpha, preserveDrawingBuffer: alpha });
  r.setPixelRatio(alpha ? 1 : Math.min(devicePixelRatio, 2));
  r.setSize(w, h, false);
  r.outputColorSpace = THREE.SRGBColorSpace;
  r.toneMapping = THREE.NeutralToneMapping;
  r.toneMappingExposure = 1.0;
  if (alpha) r.setClearColor(0x000000, 0);
  return r;
}

let logoPromise;
const getLogo = () => (logoPromise ||= loadImage(LOGO_URL));

async function buildPack(id, renderer) {
  const pack = PACKS[id];
  await document.fonts.load('900 40px Outfit'); await document.fonts.load('700 40px Outfit'); await document.fonts.load('600 40px Outfit');
  const logo = await getLogo();
  const obj = pack.type === 'jug' ? await buildJug(pack, logo, renderer) : await buildPouch(pack, logo, renderer);
  obj.rotation.y = VIEW_ANGLE[pack.type];
  const holder = new THREE.Group(); holder.add(obj);
  return holder;
}

function frame(camera, object, aspect) {
  const box = new THREE.Box3().setFromObject(object);
  const size = box.getSize(new THREE.Vector3()), center = box.getCenter(new THREE.Vector3());
  const vfov = THREE.MathUtils.degToRad(camera.fov);
  const distH = (size.y / 2) / Math.tan(vfov / 2);
  const distW = (size.x / 2) / (Math.tan(vfov / 2) * aspect);
  const dist = Math.max(distH, distW) * 1.12 + size.z / 2;
  const elev = 0.16; // look slightly down onto the pack
  camera.position.set(center.x, center.y + Math.sin(elev) * dist, center.z + Math.cos(elev) * dist);
  camera.lookAt(center);
  camera.updateProjectionMatrix();
  return center;
}

// ---- Still render for the website -----------------------------------------------------
window.renderPack = async (id, W = 1200, H = 1500) => {
  const canvas = document.createElement('canvas');
  const renderer = setupRenderer(canvas, W, H, true);
  const scene = makeScene(renderer);
  const obj = await buildPack(id, renderer);
  scene.add(obj);
  const camera = new THREE.PerspectiveCamera(24, W / H, 0.01, 50);
  frame(camera, obj, W / H);
  renderer.render(scene, camera);
  const url = canvas.toDataURL('image/png');
  // where the pour point lands in the image, in pixels (the site aims the oil stream at it)
  const inner = obj.children[0];
  obj.updateMatrixWorld(true);
  const m = inner.localToWorld(inner.userData.mouth.clone()).project(camera);
  window.lastMouth = [(m.x + 1) / 2 * W, (1 - m.y) / 2 * H];
  renderer.dispose();
  return url;
};
window.PACK_IDS = Object.keys(PACKS);

// ---- Interactive viewer ---------------------------------------------------------------
(async function viewer() {
  const canvas = document.getElementById('view');
  if (!canvas) return;
  const renderer = setupRenderer(canvas, innerWidth, innerHeight, true);
  const scene = makeScene(renderer);
  const camera = new THREE.PerspectiveCamera(24, innerWidth / innerHeight, 0.01, 50);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  let current = null, currentId = null;

  const ui = document.getElementById('ui');
  const buttons = {};
  const show = async (id) => {
    currentId = id;
    Object.entries(buttons).forEach(([k, b]) => b.setAttribute('aria-pressed', k === id));
    const obj = await buildPack(id, renderer);
    if (currentId !== id) return;
    if (current) scene.remove(current);
    current = obj; scene.add(obj);
    controls.target.copy(frame(camera, obj, innerWidth / innerHeight));
    controls.update();
  };
  Object.entries(PACKS).forEach(([id, p]) => {
    const b = document.createElement('button');
    b.textContent = p.label; b.onclick = () => show(id);
    buttons[id] = b; ui.append(b);
  });
  const dl = document.createElement('button');
  dl.className = 'dl'; dl.textContent = 'Download PNG';
  dl.onclick = async () => {
    const a = document.createElement('a');
    a.href = await window.renderPack(currentId); a.download = `${currentId}.png`; a.click();
  };
  ui.append(dl);

  addEventListener('resize', () => {
    renderer.setSize(innerWidth, innerHeight, false);
    camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  });
  renderer.setAnimationLoop(() => { controls.update(); renderer.render(scene, camera); });
  await show(new URLSearchParams(location.search).get('pack') || '5l-can');
  window.studioReady = true;
})();
