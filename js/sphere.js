import * as THREE from 'three';

/**
 * Creates a copper particle sphere on the given canvas element.
 * Returns a control object with destroy() method.
 */
export function createCopperSphere(canvasElement, options = {}) {
  const {
    particleCount = 10000,
    radius = 2.5,
    pointSize = 3.5,
    rotationSpeed = 0.0008,
    noiseAmplitude = 0.12,
    cameraZ = 5.5,
  } = options;

  if (!canvasElement) return null;

  const width = canvasElement.clientWidth || 500;
  const height = canvasElement.clientHeight || 500;

  // Scene
  const scene = new THREE.Scene();

  // Camera
  const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
  camera.position.z = cameraZ;

  // Renderer
  const renderer = new THREE.WebGLRenderer({
    canvas: canvasElement,
    alpha: true,
    antialias: true,
  });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // Build particle geometry using Fibonacci sphere distribution
  const particleGeom = new THREE.BufferGeometry();
  const posArray = new Float32Array(particleCount * 3);
  const basePositions = new Float32Array(particleCount * 3); // store originals for wave
  const colorArray = new Float32Array(particleCount * 3);

  const goldenRatio = (1 + Math.sqrt(5)) / 2;

  for (let i = 0; i < particleCount; i++) {
    const theta = (2 * Math.PI * i) / goldenRatio;
    const phi = Math.acos(1 - 2 * (i + 0.5) / particleCount);

    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.sin(phi) * Math.sin(theta);
    const z = radius * Math.cos(phi);

    const idx = i * 3;
    posArray[idx] = x;
    posArray[idx + 1] = y;
    posArray[idx + 2] = z;

    basePositions[idx] = x;
    basePositions[idx + 1] = y;
    basePositions[idx + 2] = z;

    // Color: gradient from bronze (bottom) -> copper (equator) -> gold (top)
    const t = (z + radius) / (2 * radius); // 0 at bottom, 1 at top
    const equatorFactor = Math.sin(t * Math.PI); // peaks at equator

    // Bronze: (0.545, 0.369, 0.235)
    // Copper: (0.722, 0.451, 0.200)
    // Gold:   (0.831, 0.644, 0.298)
    const r = 0.545 + (0.831 - 0.545) * t * 0.7 + equatorFactor * 0.15;
    const g = 0.369 + (0.644 - 0.369) * t * 0.6 + equatorFactor * 0.1;
    const b = 0.200 + (0.298 - 0.200) * t * 0.3;

    colorArray[idx] = Math.min(r, 1);
    colorArray[idx + 1] = Math.min(g, 1);
    colorArray[idx + 2] = Math.min(b, 1);
  }

  particleGeom.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
  particleGeom.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));

  // Material
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

  // Ambient light (warm)
  const ambient = new THREE.AmbientLight(0xD4A44C, 0.3);
  scene.add(ambient);

  // Point light for metallic highlight (top-right)
  const light = new THREE.PointLight(0xD4A44C, 2, 15);
  light.position.set(3, 3, 3);
  scene.add(light);

  // Animation loop
  let time = 0;
  let animFrameId;
  let isDestroyed = false;

  function animate() {
    if (isDestroyed) return;
    animFrameId = requestAnimationFrame(animate);
    time += 0.008;

    points.rotation.y += rotationSpeed;
    points.rotation.x = Math.sin(time * 0.3) * 0.03;

    // Wave deformation
    const pos = particleGeom.attributes.position.array;
    for (let i = 0; i < particleCount; i++) {
      const idx = i * 3;
      const bx = basePositions[idx];
      const by = basePositions[idx + 1];
      const bz = basePositions[idx + 2];

      const theta = Math.atan2(bz, bx);
      const phi = Math.acos(by / radius);

      const noise = Math.sin(phi * 5 + time * 1.5) *
                    Math.cos(theta * 4 + time * 0.8) *
                    noiseAmplitude;

      const newR = radius + noise;
      const sinPhi = Math.sin(phi);

      pos[idx]     = newR * sinPhi * Math.cos(theta);
      pos[idx + 1] = newR * Math.cos(phi);
      pos[idx + 2] = newR * sinPhi * Math.sin(theta);
    }
    particleGeom.attributes.position.needsUpdate = true;

    renderer.render(scene, camera);
  }

  animate();

  // Resize handler
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
    scene,
    camera,
    renderer,
    points,
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
