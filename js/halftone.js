/**
 * Premium halftone shader — WebGL fullscreen plane with custom GLSL.
 * Renders copper/bronze lozenge-shaped dots on a dark background,
 * arranged in flowing curved rows that suggest a 3D metallic surface.
 * Dark gaps between dots create luxurious depth.
 *
 * API: createHalftone(canvas) → { pause, resume, destroy }
 */
import * as THREE from 'three';

/* ═══════════════════════════════════════════════════════════════════
   VERTEX SHADER — passthrough fullscreen quad
   ═══════════════════════════════════════════════════════════════════ */
const VERT = /* glsl */ `
void main() {
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

/* ═══════════════════════════════════════════════════════════════════
   FRAGMENT SHADER — halftone dot grid with metallic lighting
   ═══════════════════════════════════════════════════════════════════ */
const FRAG = /* glsl */ `
precision highp float;

uniform float uTime;
uniform vec2  uResolution;
uniform vec2  uMouse;

/* ── Simplex 3D noise (Ashima Arts / Ian McEwan) ── */
vec3 mod289(vec3 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314*r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);

  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);

  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;

  i = mod289(i);
  vec4 p = permute(permute(permute(
    i.z + vec4(0.0, i1.z, i2.z, 1.0))
    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
    + i.x + vec4(0.0, i1.x, i2.x, 1.0));

  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);

  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;

  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);

  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;

  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}

/* ── Height field — draped metallic cloth with wind motion ── */
float heightField(vec2 p, float t) {
  // Silk-in-wind motion: slow drift + gentle oscillation
  float drift = t * 0.035;
  float breath = sin(t * 0.5) * 0.15 + sin(t * 0.3 + 0.7) * 0.08;
  vec2 dp = p + vec2(drift + breath, drift * 0.6 + breath * 0.4);

  // Minimal noise — just enough to break perfect symmetry
  float warp = snoise(vec3(dp * 0.35, t * 0.02)) * 0.05;

  // Deep structural folds — like creases in draped metal cloth
  float fold1 = sin(dp.y * 2.2 + dp.x * 0.6 + warp * 2.0) * 0.32;
  float fold2 = sin(dp.x * 1.6 - dp.y * 0.5 + warp * 1.2) * 0.14;
  float fold3 = sin((dp.x + dp.y) * 1.1 + warp) * 0.08;

  return fold1 + fold2 + fold3;
}

/* Fast height for normal offsets */
float heightFast(vec2 p, float t) {
  float drift = t * 0.035;
  float breath = sin(t * 0.5) * 0.15 + sin(t * 0.3 + 0.7) * 0.08;
  vec2 dp = p + vec2(drift + breath, drift * 0.6 + breath * 0.4);
  float fold1 = sin(dp.y * 2.2 + dp.x * 0.6) * 0.32;
  float fold2 = sin(dp.x * 1.6 - dp.y * 0.5) * 0.14;
  float fold3 = sin((dp.x + dp.y) * 1.1) * 0.08;
  return fold1 + fold2 + fold3;
}

/* ── Copper tone ramp — chained smoothstep ── */
vec3 copperTone(float t) {
  vec3 c0 = vec3(0.070, 0.018, 0.006);  // deep shadow
  vec3 c1 = vec3(0.110, 0.045, 0.022);
  vec3 c2 = vec3(0.190, 0.085, 0.042);
  vec3 c3 = vec3(0.480, 0.200, 0.075);  // warm bronze
  vec3 c4 = vec3(0.680, 0.350, 0.135);  // copper
  vec3 c5 = vec3(0.790, 0.510, 0.230);  // warm amber
  vec3 c6 = vec3(0.850, 0.680, 0.420);  // champagne gold

  vec3 color = c0;
  color = mix(color, c1, smoothstep(0.0,  0.12, t));
  color = mix(color, c2, smoothstep(0.10, 0.25, t));
  color = mix(color, c3, smoothstep(0.22, 0.45, t));
  color = mix(color, c4, smoothstep(0.40, 0.62, t));
  color = mix(color, c5, smoothstep(0.58, 0.80, t));
  color = mix(color, c6, smoothstep(0.78, 1.00, t));
  return color;
}

/* ── ACES filmic tone mapping ── */
vec3 ACESFilm(vec3 x) {
  float a = 2.51, b = 0.03, c = 2.43, d = 0.59, e = 0.14;
  return clamp((x*(a*x+b))/(x*(c*x+d)+e), 0.0, 1.0);
}

/* ═══════════════ MAIN ═══════════════ */
void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  float aspect = uResolution.x / uResolution.y;

  vec2 p = (uv - 0.5) * vec2(aspect, 1.0);
  p += uMouse * 0.006;

  float t = uTime;

  /* ── 1. Surface height & normals (for lighting) ── */
  float eps = 0.006;
  float hc = heightField(p, t);
  float hx = heightFast(p + vec2(eps, 0.0), t);
  float hy = heightFast(p + vec2(0.0, eps), t);

  float nStr = 1.10;
  vec3 N = normalize(vec3(
    -(hx - hc) / eps * nStr,
    -(hy - hc) / eps * nStr,
    1.0
  ));

  /* ── 2. Simple metallic lighting — key light only ── */
  vec3 V = vec3(0.0, 0.0, 1.0);
  vec3 L = normalize(vec3(0.5, 0.45, 0.65));
  float NdotL = max(dot(N, L), 0.0);
  vec3 H = normalize(L + V);
  float NdotH = max(dot(N, H), 0.001);

  // Anisotropic brush
  float brushAngle = 0.08;
  vec3 T = normalize(vec3(cos(brushAngle), sin(brushAngle), 0.0));
  T = normalize(T - N * dot(T, N));
  vec3 B = cross(N, T);
  float ax = 0.40, ay = 0.10;
  float TdotH = dot(T, H);
  float BdotH = dot(B, H);
  float ex = -((TdotH*TdotH)/(ax*ax) + (BdotH*BdotH)/(ay*ay)) / (NdotH*NdotH);
  float spec = exp(ex) * NdotL;

  // Soft fill — barely there
  vec3 Lf = normalize(vec3(-0.3, 0.0, 0.9));
  float fillDiff = max(dot(N, Lf), 0.0) * 0.08;

  float lum = NdotL * 0.35 + spec * 0.65 + fillDiff;

  // Gentle midtone compression
  lum = pow(max(0.0, lum), 1.1);

  /* ── 3. Compositional bias — right-heavy but not extreme ── */
  float compX = smoothstep(-0.3, 0.6, p.x);
  float compY = smoothstep(-0.4, 0.5, p.y);
  float comp = mix(0.15, 1.0, compX * 0.6 + compY * 0.4);
  lum *= comp;

  /* ── 4. Warm glow — strong copper hotspot upper-right ── */
  vec2 glowC = vec2(0.78, 0.72);
  float glowD = length((uv - glowC) * vec2(0.7, 0.8));
  lum += exp(-glowD * glowD * 1.8) * 0.18;

  // Secondary broad fill glow — lights up more of the right half
  vec2 glowC2 = vec2(0.60, 0.50);
  float glowD2 = length((uv - glowC2) * vec2(0.6, 0.7));
  lum += exp(-glowD2 * glowD2 * 1.5) * 0.08;

  /* ── 5. Vignette — gentle, mostly fades far edges ── */
  float vigD = length((uv - vec2(0.55, 0.50)) * vec2(0.70, 0.55));
  float vignette = 1.0 - smoothstep(0.40, 1.0, vigD);
  lum *= vignette;

  /* ── 6. Left-edge fade ── */
  float leftFade = smoothstep(0.0, 0.20, uv.x);
  lum *= leftFade;

  lum = clamp(lum, 0.0, 1.0);

  /* ── 7. Halftone dot grid — round dots, dramatic curvature ── */
  // Dense grid — tightly packed dots like reference
  float gridFreq = 110.0;
  vec2 gridScale = vec2(gridFreq, gridFreq / aspect);
  vec2 gridUV = uv * gridScale;

  // Strong structural grid warp — dramatic curved rows from the folds
  // This is NOT liquid — the folds are structural sine waves, not noise
  float warpStr = 5.0;
  gridUV.x += hc * warpStr;
  gridUV.y += hc * warpStr * 0.75;

  // Radial convergence — dots converge toward a focus for 3D drape feel
  vec2 focus = vec2(0.62, 0.50);
  vec2 toFocus = uv - focus;
  float radDist = length(toFocus);
  gridUV += toFocus * radDist * 3.5;

  // Cell coordinates
  vec2 cell = fract(gridUV) - 0.5;

  // ROUND dots — Euclidean distance, NOT diamond/Manhattan
  // Slight oval stretch (wider than tall) for organic quality
  float dist = length(cell * vec2(1.0, 1.15));

  // Dot size driven by luminance — large in bright areas, tiny in dark
  // In brightest areas dots nearly touch neighbors
  float dotRadius = smoothstep(0.01, 0.50, lum) * 0.46;

  // Anti-aliased edge
  float dotMask = 1.0 - smoothstep(dotRadius - 0.025, dotRadius + 0.025, dist);

  /* ── 8. Dot color — copper tone mapped from luminance ── */
  vec3 dotColor = copperTone(lum);

  // Subtle specular sheen on brightest dots
  float peak = pow(max(0.0, (lum - 0.60) / 0.40), 3.0);
  dotColor += vec3(0.90, 0.72, 0.48) * peak * 0.12;

  // ACES tone map
  dotColor = ACESFilm(dotColor * 1.2);

  /* ── 9. Output — dots are opaque copper, gaps are transparent ── */
  float alpha = dotMask * smoothstep(0.0, 0.16, uv.x);

  gl_FragColor = vec4(dotColor, alpha);
}
`;

/* ═══════════════════════════════════════════════════════════════════
   createHalftone — public API (drop-in replacement)
   ═══════════════════════════════════════════════════════════════════ */
export function createHalftone(canvasElement) {
  if (!canvasElement) return null;

  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

  /* ── Three.js setup ── */
  const renderer = new THREE.WebGLRenderer({
    canvas: canvasElement,
    alpha: true,
    antialias: false,
    premultipliedAlpha: false,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(dpr);
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const uniforms = {
    uTime:       { value: 0.0 },
    uResolution: { value: new THREE.Vector2() },
    uMouse:      { value: new THREE.Vector2(0, 0) },
  };

  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: VERT,
    fragmentShader: FRAG,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });

  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
  scene.add(mesh);

  /* ── Sizing ── */
  function resize() {
    const w = canvasElement.clientWidth;
    const h = canvasElement.clientHeight;
    if (w === 0 || h === 0) return;
    renderer.setSize(w, h, false);
    uniforms.uResolution.value.set(w * dpr, h * dpr);
  }
  resize();

  const resizeObs = new ResizeObserver(resize);
  resizeObs.observe(canvasElement);

  /* ── Mouse tracking (damped) ── */
  const mouseT = { x: 0, y: 0 };
  const mouseC = { x: 0, y: 0 };

  function onMouse(e) {
    mouseT.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouseT.y = -(e.clientY / window.innerHeight) * 2 + 1;
  }
  document.addEventListener('mousemove', onMouse);

  /* ── Animation ── */
  let running = true;
  let paused = false;
  let animId = null;
  let frame = 0;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const timeSpeed = prefersReduced ? 0 : 0.014;

  function animate() {
    if (!running) return;
    animId = requestAnimationFrame(animate);
    if (paused) return;

    // ~30 fps via frame skip
    frame++;
    if (frame % 2 !== 0) return;

    uniforms.uTime.value += timeSpeed;

    // Damped mouse interpolation
    mouseC.x += (mouseT.x - mouseC.x) * 0.03;
    mouseC.y += (mouseT.y - mouseC.y) * 0.03;
    uniforms.uMouse.value.set(mouseC.x, mouseC.y);

    renderer.render(scene, camera);
  }

  // Initial render
  renderer.render(scene, camera);
  animate();

  /* ── Visibility observer ── */
  const visObs = new IntersectionObserver((entries) => {
    entries.forEach(e => { paused = !e.isIntersecting; });
  }, { threshold: 0.05 });
  visObs.observe(canvasElement);

  /* ── Public API ── */
  return {
    pause()  { paused = true; },
    resume() { paused = false; },
    destroy() {
      running = false;
      if (animId) cancelAnimationFrame(animId);
      visObs.disconnect();
      resizeObs.disconnect();
      document.removeEventListener('mousemove', onMouse);
      material.dispose();
      mesh.geometry.dispose();
      renderer.dispose();
    },
  };
}
