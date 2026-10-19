/* ==========================================================
   Flowing golden coconut oil: WebGL fragment shader
   initOil(canvas, { pointerTarget })
   ========================================================== */

function initOil(canvas, opts = {}) {
  const host = opts.pointerTarget || canvas.parentElement;
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false });
  if (!gl) { host.classList.add('no-webgl'); return; }

  const vert = 'attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }';
  const frag = `
    #ifdef GL_FRAGMENT_PRECISION_HIGH
      precision highp float;
    #else
      precision mediump float;
    #endif
    uniform vec2 uRes;
    uniform float uTime;
    uniform vec2 uMouse;
    uniform float uPress;

    vec2 hash(vec2 p) {
      p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
      return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
    }
    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(mix(dot(hash(i), f), dot(hash(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), u.x),
                 mix(dot(hash(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)), dot(hash(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0)), u.x), u.y);
    }
    float fbm(vec2 p) {
      float v = 0.0;
      float a = 0.5;
      mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
      for (int i = 0; i < 4; i++) { v += a * noise(p); p = m * p; a *= 0.5; }
      return v;
    }
    // gentle, slow height field: a calm pool of clear oil (not marbled)
    float field(vec2 p) {
      float t = uTime * 0.035;
      vec2 q = vec2(fbm(p + vec2(0.0, t)), fbm(p + vec2(5.2, 1.3) - t));
      return fbm(p + 1.1 * q + vec2(t * 0.6, -t * 0.4));
    }
    // light refracting through clear oil: bright moving network of lines
    float caustic(vec2 p, vec2 bend) {
      float t = uTime * 0.12;
      vec2 q = p * 2.6 + bend * 1.4;
      float a = noise(q + vec2(t, -t * 0.7));
      float b = noise(q * 1.7 - vec2(t * 0.8, t * 0.5));
      return pow(1.0 - abs(a), 10.0) + pow(1.0 - abs(b), 10.0) * 0.6;
    }
    void main() {
      vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
      vec2 m = (uMouse - 0.5 * uRes) / uRes.y;
      vec2 uv = gl_FragCoord.xy / uRes;

      vec2 dm = p - m;
      float infl = exp(-dot(dm, dm) * 7.0);
      p -= dm * infl * (0.12 + 0.18 * uPress);
      p *= 1.1;

      float h = field(p);
      float e = 0.02;
      float hx = field(p + vec2(e, 0.0)) - h;
      float hy = field(p + vec2(0.0, e)) - h;
      vec3 n = normalize(vec3(-hx * 12.0, -hy * 12.0, 1.0));

      vec3 L = normalize(vec3(-0.35, 0.55, 0.85));
      float diff = clamp(dot(n, L), 0.0, 1.0);
      float spec = pow(clamp(dot(reflect(-L, n), vec3(0.0, 0.0, 1.0)), 0.0, 1.0), 70.0);

      // clear golden coconut-oil palette: warm gold, no browns
      float k = clamp(h * 1.3 + 0.5, 0.0, 1.0);
      vec3 deeper = vec3(0.84, 0.58, 0.14);
      vec3 light  = vec3(0.94, 0.75, 0.30);
      vec3 pale   = vec3(0.99, 0.88, 0.55);
      vec3 col = mix(deeper, light, smoothstep(0.1, 0.6, k));
      col = mix(col, pale, smoothstep(0.55, 1.0, k));

      col *= 0.86 + 0.18 * diff;
      col += vec3(1.0, 0.9, 0.6) * caustic(p, n.xy) * 0.22;
      col += vec3(1.0, 0.96, 0.85) * spec * 0.45;
      col += vec3(1.0, 0.9, 0.6) * infl * 0.05;

      col = mix(col, pale, smoothstep(0.5, 1.2, uv.y) * 0.12);
      col *= 1.0 - 0.18 * smoothstep(0.3, 1.1, length(uv - vec2(0.5, 0.55)));
      gl_FragColor = vec4(col, 1.0);
    }`;

  const compile = (type, src) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn(gl.getShaderInfoLog(s)); return null; }
    return s;
  };
  const vs = compile(gl.VERTEX_SHADER, vert);
  const fs = compile(gl.FRAGMENT_SHADER, frag);
  if (!vs || !fs) { host.classList.add('no-webgl'); return; }
  const prog = gl.createProgram();
  gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { host.classList.add('no-webgl'); return; }
  gl.useProgram(prog);

  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const uRes = gl.getUniformLocation(prog, 'uRes');
  const uTime = gl.getUniformLocation(prog, 'uTime');
  const uMouse = gl.getUniformLocation(prog, 'uMouse');
  const uPress = gl.getUniformLocation(prog, 'uPress');

  // the oil is soft, so rendering at reduced resolution is invisible and much faster
  let scale = 0.5;
  const resize = () => {
    scale = (window.innerWidth < 768 ? 0.4 : 0.55) * Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(canvas.clientWidth * scale));
    canvas.height = Math.max(1, Math.round(canvas.clientHeight * scale));
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(uRes, canvas.width, canvas.height);
  };
  resize();
  new ResizeObserver(resize).observe(canvas);

  const mouse = { x: canvas.width * 0.5, y: canvas.height * 0.5, tx: canvas.width * 0.5, ty: canvas.height * 0.5 };
  let press = 0, pressTarget = 0;
  host.addEventListener('pointermove', (e) => {
    const r = canvas.getBoundingClientRect();
    mouse.tx = (e.clientX - r.left) * scale;
    mouse.ty = (r.height - (e.clientY - r.top)) * scale;
  });
  host.addEventListener('pointerdown', () => { pressTarget = 1; });
  window.addEventListener('pointerup', () => { pressTarget = 0; });

  let visible = true, raf = 0, last = performance.now(), t = 12;
  const frame = (now) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now; t += dt;
    if (!finePointer) {
      mouse.tx = canvas.width * (0.5 + 0.3 * Math.sin(t * 0.25));
      mouse.ty = canvas.height * (0.5 + 0.25 * Math.cos(t * 0.19));
    }
    mouse.x += (mouse.tx - mouse.x) * 0.06;
    mouse.y += (mouse.ty - mouse.y) * 0.06;
    press += (pressTarget - press) * 0.08;
    gl.uniform1f(uTime, t);
    gl.uniform2f(uMouse, mouse.x, mouse.y);
    gl.uniform1f(uPress, press);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (visible && !reduceMotion) raf = requestAnimationFrame(frame);
  };

  if (reduceMotion) { requestAnimationFrame(frame); return; }
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    cancelAnimationFrame(raf);
    if (visible) { last = performance.now(); raf = requestAnimationFrame(frame); }
  }).observe(canvas);
}
