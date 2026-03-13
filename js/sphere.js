import * as THREE from 'three';

/**
 * Creates a copper particle sphere on the given canvas element.
 * Returns a control object with destroy() and pause()/resume() methods.
 */
export function createCopperSphere(canvasElement, options = {}) {
  const {
    particleCount = 4000,
    radius = 2.5,
    pointSize = 3.5,
    rotationSpeed = 0.0008,
    noiseAmplitude = 0.12,
    cameraZ = 5.5,
    maxPixelRatio = 2,
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
  const basePositions = new Float32Array(particleCount * 3);
  const colorArray = new Float32Array(particleCount * 3);

  // Pre-compute spherical coords for wave deformation (avoids per-frame trig)
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
    const y = radius * sinPhi * Math.sin(theta);
    const z = radius * cosPhi;

    const idx = i * 3;
    posArray[idx] = x;
    posArray[idx + 1] = y;
    posArray[idx + 2] = z;
    basePositions[idx] = x;
    basePositions[idx + 1] = y;
    basePositions[idx + 2] = z;

    // Store precomputed spherical coords
    thetaArr[i] = Math.atan2(z, x);
    phiArr[i] = phi;
    sinPhiArr[i] = sinPhi;
    cosPhiArr[i] = cosPhi;

    // Color: bronze (bottom) -> copper (equator) -> gold (top)
    const t = (z + radius) / (2 * radius);
    const equatorFactor = Math.sin(t * Math.PI);
    colorArray[idx]     = Math.min(0.545 + 0.200 * t + equatorFactor * 0.15, 1);
    colorArray[idx + 1] = Math.min(0.369 + 0.165 * t + equatorFactor * 0.1, 1);
    colorArray[idx + 2] = Math.min(0.200 + 0.029 * t, 1);
  }

  particleGeom.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
  particleGeom.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));

  const material = new THREE.PointsMaterial({
    size: pointSize,
    vertexColors: true,
    transparent: true,
    opacity: 0.85,
    sizeAttenuation: true,
    depthWrite: false,
  });

  const points = new THREE.Points(particleGeom, material);
  scene.add(points);
  // No lights needed — PointsMaterial is unlit

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

    // Wave deformation every 3rd frame — using precomputed spherical coords
    if (frameCount % 3 === 0) {
      const pos = particleGeom.attributes.position.array;
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
        pos[idx]     = newR * sinPhi * Math.cos(theta);
        pos[idx + 1] = newR * cosPhi;
        pos[idx + 2] = newR * sinPhi * Math.sin(theta);
      }
      particleGeom.attributes.position.needsUpdate = true;
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
