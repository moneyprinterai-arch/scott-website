import * as THREE from 'three';

/**
 * Creates a copper particle sphere with latitude-row distribution,
 * undulating wave animation, and directional lighting.
 * Light comes from upper-left, creating golden-amber → copper → dark shadow gradient.
 */
export function createCopperSphere(canvasElement, options = {}) {
  const {
    rows = 100,
    colsBase = 200,
    radius = 1,
    rotationSpeed = 0.001,
    waveAmplitude = 0.04,
    waveSpeed = 1.5,
    cameraZ = 2.6,
    maxPixelRatio = 2,
    lightDirection = [-1.0, 0.8, 0.5], // upper-left
    basePointSize = 3.5,
    useAdditiveBlending = false,
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

  // Build particle geometry — latitude-row distribution (like a globe)
  const positions = [];
  const latData = []; // phi, theta per point for wave animation
  const rowIndices = []; // which row each point belongs to

  for (let lat = 0; lat < rows; lat++) {
    const phi = (lat / (rows - 1)) * Math.PI; // 0 to PI
    const y = Math.cos(phi) * radius;
    const r = Math.sin(phi) * radius;
    const cols = Math.max(1, Math.floor(colsBase * Math.sin(phi)));

    for (let col = 0; col < cols; col++) {
      const theta = (col / cols) * Math.PI * 2;
      const x = Math.cos(theta) * r;
      const z = Math.sin(theta) * r;
      positions.push(x, y, z);
      latData.push(phi, theta, r);
      rowIndices.push(lat);
    }
  }

  const particleCount = positions.length / 3;
  const posArray = new Float32Array(positions);
  const normalArray = new Float32Array(particleCount * 3);
  const phiArray = new Float32Array(particleCount);
  const thetaArray = new Float32Array(particleCount);
  const ringRadiusArray = new Float32Array(particleCount);
  const sinPhiArray = new Float32Array(particleCount);
  const cosPhiArray = new Float32Array(particleCount);

  // Pre-compute per-particle data
  for (let i = 0; i < particleCount; i++) {
    phiArray[i] = latData[i * 3];
    thetaArray[i] = latData[i * 3 + 1];
    ringRadiusArray[i] = latData[i * 3 + 2];
    sinPhiArray[i] = Math.sin(phiArray[i]);
    cosPhiArray[i] = Math.cos(phiArray[i]);

    const idx = i * 3;
    const x = posArray[idx];
    const y = posArray[idx + 1];
    const z = posArray[idx + 2];
    const len = Math.sqrt(x * x + y * y + z * z) || 1;
    normalArray[idx] = x / len;
    normalArray[idx + 1] = y / len;
    normalArray[idx + 2] = z / len;
  }

  const particleGeom = new THREE.BufferGeometry();
  particleGeom.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
  particleGeom.setAttribute('aNormal', new THREE.BufferAttribute(normalArray, 3));

  const dpr = Math.min(window.devicePixelRatio, maxPixelRatio);

  // Custom shader material for directional lighting on particles
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uLightDir: { value: new THREE.Vector3(...lightDirection).normalize() },
      uPointSize: { value: basePointSize * dpr },
      // Dark shadow → mid copper → bright golden-amber → highlight
      uColorShadow: { value: new THREE.Color(useAdditiveBlending ? 0x1a0500 : 0x1A0503) },
      uColorMid: { value: new THREE.Color(useAdditiveBlending ? 0x7a3a0a : 0xA0521A) },
      uColorLit: { value: new THREE.Color(useAdditiveBlending ? 0xd4870a : 0xE8A030) },
      uColorHighlight: { value: new THREE.Color(useAdditiveBlending ? 0xffb347 : 0xF5C060) },
    },
    vertexShader: `
      attribute vec3 aNormal;
      uniform vec3 uLightDir;
      uniform float uPointSize;
      varying float vLightIntensity;

      void main() {
        // Transform normal by model rotation
        vec3 worldNormal = normalize(normalMatrix * aNormal);

        // Directional light intensity
        float NdotL = dot(worldNormal, uLightDir);

        // Remap from [-1,1] to [0,1] with shadow bias
        vLightIntensity = smoothstep(-0.5, 1.0, NdotL);

        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

        // Size varies by light: brighter = larger, darker = smaller
        float sizeMult = mix(0.7, 1.3, vLightIntensity);
        gl_PointSize = uPointSize * sizeMult * (3.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 uColorShadow;
      uniform vec3 uColorMid;
      uniform vec3 uColorLit;
      uniform vec3 uColorHighlight;
      varying float vLightIntensity;

      void main() {
        // Circular point shape
        vec2 center = gl_PointCoord - vec2(0.5);
        float dist = length(center);
        if (dist > 0.5) discard;

        // Soft edge
        float alpha = 1.0 - smoothstep(0.3, 0.5, dist);

        // Multi-stop color gradient based on light intensity
        vec3 color;
        float t = vLightIntensity;
        if (t < 0.25) {
          color = mix(uColorShadow, uColorMid, t / 0.25);
        } else if (t < 0.6) {
          color = mix(uColorMid, uColorLit, (t - 0.25) / 0.35);
        } else {
          color = mix(uColorLit, uColorHighlight, (t - 0.6) / 0.4);
        }

        // Brightness varies with light
        alpha *= mix(0.6, 1.0, t);

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

    // Slow Y rotation
    points.rotation.y += rotationSpeed;

    // Wave deformation every 2nd frame for performance
    if (frameCount % 2 === 0) {
      const pos = particleGeom.attributes.position.array;
      const nrm = particleGeom.attributes.aNormal.array;

      for (let i = 0; i < particleCount; i++) {
        const idx = i * 3;
        const theta = thetaArray[i];
        const sinPhi = sinPhiArray[i];
        const cosPhi = cosPhiArray[i];

        // Undulating wave: sine wave rolling across the sphere surface
        // y_offset applied as radial displacement
        const wave = Math.sin(theta * 2 + time * waveSpeed) * waveAmplitude * sinPhi;
        const newR = radius + wave;

        const x = Math.cos(theta) * newR * sinPhi;
        const y = newR * cosPhi;
        const z = Math.sin(theta) * newR * sinPhi;

        pos[idx] = x;
        pos[idx + 1] = y;
        pos[idx + 2] = z;

        // Update normals
        const len = Math.sqrt(x * x + y * y + z * z) || 1;
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
