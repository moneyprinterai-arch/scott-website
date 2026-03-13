import * as THREE from 'three';

/**
 * Creates a copper particle sphere with directional lighting simulation.
 * Light comes from upper-right, creating dark maroon → golden amber gradient.
 */
export function createCopperSphere(canvasElement, options = {}) {
  const {
    particleCount = 6000,
    radius = 2.5,
    rotationSpeed = 0.0008,
    noiseAmplitude = 0.08,
    cameraZ = 5.5,
    maxPixelRatio = 2,
    lightDirection = [0.6, 0.5, 0.7], // upper-right-front
    useAdditiveBlending = true,
  } = options;

  if (!canvasElement) return null;

  const width = canvasElement.clientWidth || 500;
  const height = canvasElement.clientHeight || 500;

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
  camera.position.z = cameraZ;

  const renderer = new THREE.WebGLRenderer({
    canvas: canvasElement,
    alpha: true,
    antialias: false,
    powerPreference: 'high-performance',
  });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, maxPixelRatio));

  // Build particle geometry — Fibonacci sphere distribution
  const particleGeom = new THREE.BufferGeometry();
  const posArray = new Float32Array(particleCount * 3);
  const normalArray = new Float32Array(particleCount * 3);

  // Pre-compute spherical coords for wave deformation
  const thetaArr = new Float32Array(particleCount);
  const phiArr = new Float32Array(particleCount);
  const sinPhiArr = new Float32Array(particleCount);
  const cosPhiArr = new Float32Array(particleCount);

  const goldenRatio = (1 + Math.sqrt(5)) / 2;

  for (let i = 0; i < particleCount; i++) {
    const theta = (2 * Math.PI * i) / goldenRatio;
    const phi = Math.acos(1 - 2 * (i + 0.5) / particleCount);

    const sinPhi = Math.sin(phi);
    const cosPhi = Math.cos(phi);
    const x = radius * sinPhi * Math.cos(theta);
    const y = radius * cosPhi;
    const z = radius * sinPhi * Math.sin(theta);

    const idx = i * 3;
    posArray[idx] = x;
    posArray[idx + 1] = y;
    posArray[idx + 2] = z;

    // Normal = normalized position (sphere surface normal)
    const len = Math.sqrt(x * x + y * y + z * z);
    normalArray[idx] = x / len;
    normalArray[idx + 1] = y / len;
    normalArray[idx + 2] = z / len;

    thetaArr[i] = Math.atan2(z, x);
    phiArr[i] = phi;
    sinPhiArr[i] = sinPhi;
    cosPhiArr[i] = cosPhi;
  }

  particleGeom.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
  particleGeom.setAttribute('aNormal', new THREE.BufferAttribute(normalArray, 3));

  // Custom shader material for directional lighting on particles
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uLightDir: { value: new THREE.Vector3(...lightDirection).normalize() },
      uPointSize: { value: (useAdditiveBlending ? 3.0 : 3.5) * Math.min(window.devicePixelRatio, maxPixelRatio) },
      // Dark maroon shadow → rich brown → golden amber → bright highlight
      uColorShadow: { value: new THREE.Color(useAdditiveBlending ? 0x1a0000 : 0x4a1505) },
      uColorMid: { value: new THREE.Color(useAdditiveBlending ? 0x7a3a0a : 0x8B3A0F) },
      uColorLit: { value: new THREE.Color(useAdditiveBlending ? 0xd4870a : 0xC4703A) },
      uColorHighlight: { value: new THREE.Color(useAdditiveBlending ? 0xffb347 : 0xE8A050) },
      uAlphaBoost: { value: useAdditiveBlending ? 1.0 : 1.5 },
    },
    vertexShader: `
      attribute vec3 aNormal;
      uniform vec3 uLightDir;
      uniform float uPointSize;
      varying float vLightIntensity;
      varying float vDepth;

      void main() {
        // Transform normal by model rotation (normalMatrix handles this)
        vec3 worldNormal = normalize(normalMatrix * aNormal);

        // Directional light intensity (dot product)
        float NdotL = dot(worldNormal, uLightDir);

        // Remap from [-1,1] to [0,1] with slight bias toward shadow
        vLightIntensity = smoothstep(-0.6, 1.0, NdotL);

        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vDepth = -mvPosition.z;

        // Size attenuation — closer particles appear larger
        gl_PointSize = uPointSize * (5.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 uColorShadow;
      uniform vec3 uColorMid;
      uniform vec3 uColorLit;
      uniform vec3 uColorHighlight;
      uniform float uAlphaBoost;
      varying float vLightIntensity;
      varying float vDepth;

      void main() {
        // Circular point shape
        vec2 center = gl_PointCoord - vec2(0.5);
        float dist = length(center);
        if (dist > 0.5) discard;

        // Soft edge
        float alpha = 1.0 - smoothstep(0.35, 0.5, dist);

        // Multi-stop color gradient based on light intensity
        vec3 color;
        float t = vLightIntensity;
        if (t < 0.3) {
          color = mix(uColorShadow, uColorMid, t / 0.3);
        } else if (t < 0.7) {
          color = mix(uColorMid, uColorLit, (t - 0.3) / 0.4);
        } else {
          color = mix(uColorLit, uColorHighlight, (t - 0.7) / 0.3);
        }

        // Brighten highlight dots slightly
        alpha *= mix(0.7, 1.0, t);
        alpha = clamp(alpha * uAlphaBoost, 0.0, 1.0);

        gl_FragColor = vec4(color, alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: useAdditiveBlending ? THREE.AdditiveBlending : THREE.NormalBlending,
  });

  const points = new THREE.Points(particleGeom, material);
  scene.add(points);

  // Animation state
  let time = 0;
  let animFrameId;
  let isDestroyed = false;
  let isPaused = false;
  let frameCount = 0;

  function animate() {
    if (isDestroyed) return;
    animFrameId = requestAnimationFrame(animate);
    if (isPaused) return;

    time += 0.008;
    frameCount++;

    points.rotation.y += rotationSpeed;
    points.rotation.x = Math.sin(time * 0.3) * 0.03;

    // Wave deformation every 3rd frame
    if (frameCount % 3 === 0) {
      const pos = particleGeom.attributes.position.array;
      const nrm = particleGeom.attributes.aNormal.array;
      const t15 = time * 1.5;
      const t08 = time * 0.8;

      for (let i = 0; i < particleCount; i++) {
        const idx = i * 3;
        const theta = thetaArr[i];
        const sinPhi = sinPhiArr[i];
        const cosPhi = cosPhiArr[i];

        const noise = Math.sin(phiArr[i] * 5 + t15) *
                      Math.cos(theta * 4 + t08) *
                      noiseAmplitude;

        const newR = radius + noise;
        const x = newR * sinPhi * Math.cos(theta);
        const y = newR * cosPhi;
        const z = newR * sinPhi * Math.sin(theta);

        pos[idx] = x;
        pos[idx + 1] = y;
        pos[idx + 2] = z;

        // Update normals
        const len = Math.sqrt(x * x + y * y + z * z);
        nrm[idx] = x / len;
        nrm[idx + 1] = y / len;
        nrm[idx + 2] = z / len;
      }
      particleGeom.attributes.position.needsUpdate = true;
      particleGeom.attributes.aNormal.needsUpdate = true;
    }

    renderer.render(scene, camera);
  }

  animate();

  function onResize() {
    if (isDestroyed) return;
    const w = canvasElement.clientWidth;
    const h = canvasElement.clientHeight;
    if (w === 0 || h === 0) return;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }

  window.addEventListener('resize', onResize);

  return {
    scene, camera, renderer, points,
    pause() { isPaused = true; },
    resume() { isPaused = false; },
    destroy() {
      isDestroyed = true;
      cancelAnimationFrame(animFrameId);
      window.removeEventListener('resize', onResize);
      particleGeom.dispose();
      material.dispose();
      renderer.dispose();
    },
  };
}
