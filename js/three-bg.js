/* ============================================================
   THREE-BG.JS  –  3D Hero Background
   Three.js r134  |  No build step required
   Features:
     • Particle field (data points / molecules aesthetic)
     • Floating geometric shapes (icosahedra, octahedra, torus)
     • Connection lines between nearby particles
     • Gentle mouse-parallax reaction
     • Resize handling
     • Paused when tab is hidden (perf)
     • Simplified on mobile / low-end devices
   ============================================================ */

(function () {
  'use strict';

  /* ── Guard: skip if Three.js failed to load or canvas missing ── */
  if (typeof THREE === 'undefined') {
    console.warn('three-bg.js: THREE not loaded — skipping 3D background.');
    return;
  }

  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;

  /* ── Performance tier detection ── */
  const isMobile   = window.matchMedia('(max-width: 768px)').matches;
  const prefReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isLowEnd   = navigator.hardwareConcurrency !== undefined
                       ? navigator.hardwareConcurrency <= 2
                       : false;
  const SIMPLIFIED = isMobile || prefReduced || isLowEnd;

  /* ── Scene config ── */
  const CFG = {
    particleCount  : SIMPLIFIED ?  80 : 220,
    shapeCount     : SIMPLIFIED ?   4 :  12,
    connectionDist : SIMPLIFIED ? 120 : 160,
    particleSize   : SIMPLIFIED ? 2.2 : 1.8,
    mouseStrength  : SIMPLIFIED ? 0.0 : 0.08,
    rotationSpeed  : SIMPLIFIED ? 0.0003 : 0.0006,
    floatAmplitude : 0.004,
    fov            : 60,
    near           : 0.1,
    far            : 1000,
    camZ           : 420,

    /* Colours */
    colAccent  : 0x4f46e5,   /* Indigo */
    colLight   : 0x6d64f7,
    colHighlight: 0xf59e0b,  /* Amber gold */
    colWhite   : 0xffffff,
    colBg      : 0x07090f,   /* matches hero CSS gradient start */
  };

  /* ──────────────────────────────────────────────────────────
     RENDERER
  ────────────────────────────────────────────────────────── */
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias  : !SIMPLIFIED,
    alpha      : false,
    powerPreference: 'low-power',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, SIMPLIFIED ? 1 : 2));
  renderer.setClearColor(CFG.colBg, 1);
  renderer.setSize(canvas.clientWidth, canvas.clientHeight);

  /* ──────────────────────────────────────────────────────────
     SCENE & CAMERA
  ────────────────────────────────────────────────────────── */
  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    CFG.fov,
    canvas.clientWidth / canvas.clientHeight,
    CFG.near,
    CFG.far
  );
  camera.position.z = CFG.camZ;

  /* Slight fog for depth */
  scene.fog = new THREE.FogExp2(CFG.colBg, 0.0015);

  /* ──────────────────────────────────────────────────────────
     LIGHTS
  ────────────────────────────────────────────────────────── */
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambientLight);

  const pointLight1 = new THREE.PointLight(0x6d64f7, 1.2, 600);
  pointLight1.position.set(200, 200, 100);
  scene.add(pointLight1);

  const pointLight2 = new THREE.PointLight(0xf59e0b, 0.6, 400);
  pointLight2.position.set(-200, -100, 50);
  scene.add(pointLight2);

  /* ──────────────────────────────────────────────────────────
     PARTICLE FIELD
  ────────────────────────────────────────────────────────── */
  const particlePositions = new Float32Array(CFG.particleCount * 3);
  const particleVelocities = [];

  for (let i = 0; i < CFG.particleCount; i++) {
    const x = (Math.random() - 0.5) * 800;
    const y = (Math.random() - 0.5) * 600;
    const z = (Math.random() - 0.5) * 300;

    particlePositions[i * 3]     = x;
    particlePositions[i * 3 + 1] = y;
    particlePositions[i * 3 + 2] = z;

    particleVelocities.push({
      x: (Math.random() - 0.5) * 0.12,
      y: (Math.random() - 0.5) * 0.12,
      z: (Math.random() - 0.5) * 0.06,
    });
  }

  const particleGeo = new THREE.BufferGeometry();
  particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

  const particleMat = new THREE.PointsMaterial({
    color       : 0x818cf8,
    size        : CFG.particleSize,
    sizeAttenuation: true,
    transparent : true,
    opacity     : 0.80,
    depthWrite  : false,
  });

  const particleMesh = new THREE.Points(particleGeo, particleMat);
  scene.add(particleMesh);

  /* ──────────────────────────────────────────────────────────
     CONNECTION LINES (lazy – rebuilt every N frames)
  ────────────────────────────────────────────────────────── */
  const linePositions = new Float32Array(CFG.particleCount * CFG.particleCount * 3 * 2);
  const lineGeo = new THREE.BufferGeometry();
  const lineAttr = new THREE.BufferAttribute(linePositions, 3);
  lineAttr.setUsage(THREE.DynamicDrawUsage);
  lineGeo.setAttribute('position', lineAttr);

  const lineMat = new THREE.LineSegments(
    lineGeo,
    new THREE.LineBasicMaterial({
      color      : 0x4f46e5,
      transparent: true,
      opacity    : 0.22,
      depthWrite : false,
    })
  );
  if (!SIMPLIFIED) scene.add(lineMat);

  let lineFrameSkip = 0;

  function updateConnections() {
    if (SIMPLIFIED) return;
    lineFrameSkip++;
    if (lineFrameSkip % 3 !== 0) return;   /* update every 3 frames */

    let count = 0;
    const pos = particleGeo.attributes.position.array;
    const dist2 = CFG.connectionDist * CFG.connectionDist;

    for (let i = 0; i < CFG.particleCount; i++) {
      for (let j = i + 1; j < CFG.particleCount; j++) {
        const dx = pos[i * 3]     - pos[j * 3];
        const dy = pos[i * 3 + 1] - pos[j * 3 + 1];
        const dz = pos[i * 3 + 2] - pos[j * 3 + 2];
        const d2 = dx * dx + dy * dy + dz * dz;

        if (d2 < dist2) {
          linePositions[count++] = pos[i * 3];
          linePositions[count++] = pos[i * 3 + 1];
          linePositions[count++] = pos[i * 3 + 2];
          linePositions[count++] = pos[j * 3];
          linePositions[count++] = pos[j * 3 + 1];
          linePositions[count++] = pos[j * 3 + 2];
        }
      }
    }

    lineGeo.setDrawRange(0, count / 3);
    lineGeo.attributes.position.needsUpdate = true;
  }

  /* ──────────────────────────────────────────────────────────
     FLOATING GEOMETRIC SHAPES
  ────────────────────────────────────────────────────────── */
  const shapeColors = [0x4f46e5, 0x6d64f7, 0xf59e0b, 0x818cf8, 0xa78bfa];

  const shapeMeshes = [];
  const shapeGeometries = [
    new THREE.IcosahedronGeometry(14, 0),
    new THREE.OctahedronGeometry(12, 0),
    new THREE.TetrahedronGeometry(10, 0),
    new THREE.TorusGeometry(10, 3, 8, 16),
    new THREE.IcosahedronGeometry(8, 1),
  ];

  for (let i = 0; i < CFG.shapeCount; i++) {
    const geoIndex = i % shapeGeometries.length;
    const geo = shapeGeometries[geoIndex];
    const col = shapeColors[i % shapeColors.length];

    const mat = new THREE.MeshPhongMaterial({
      color      : col,
      emissive   : col,
      emissiveIntensity: 0.15,
      wireframe  : true,
      transparent: true,
      opacity    : SIMPLIFIED ? 0.25 : 0.35,
    });

    const mesh = new THREE.Mesh(geo, mat);

    mesh.position.set(
      (Math.random() - 0.5) * 700,
      (Math.random() - 0.5) * 500,
      (Math.random() - 0.5) * 200 - 50
    );

    const scale = 0.6 + Math.random() * 1.0;
    mesh.scale.setScalar(scale);

    mesh.rotation.set(
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI * 2
    );

    /* Per-shape animation data */
    mesh.userData = {
      rotSpeed: {
        x: (Math.random() - 0.5) * 0.008,
        y: (Math.random() - 0.5) * 0.008,
        z: (Math.random() - 0.5) * 0.004,
      },
      floatOffset: Math.random() * Math.PI * 2,
      floatSpeed : 0.4 + Math.random() * 0.6,
      baseY      : mesh.position.y,
    };

    scene.add(mesh);
    shapeMeshes.push(mesh);
  }

  /* ──────────────────────────────────────────────────────────
     MOUSE TRACKING
  ────────────────────────────────────────────────────────── */
  const mouse = { x: 0, y: 0 };
  const targetMouse = { x: 0, y: 0 };

  window.addEventListener('mousemove', (e) => {
    targetMouse.x = (e.clientX / window.innerWidth  - 0.5) * 2;
    targetMouse.y = (e.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });

  /* Mobile: react to device orientation */
  if (window.DeviceOrientationEvent && isMobile) {
    window.addEventListener('deviceorientation', (e) => {
      if (e.gamma !== null && e.beta !== null) {
        targetMouse.x =  e.gamma / 45;   /* -1 to 1 */
        targetMouse.y = (e.beta - 45) / 45;
      }
    }, { passive: true });
  }

  /* ──────────────────────────────────────────────────────────
     RESIZE HANDLER
  ────────────────────────────────────────────────────────── */
  function onResize() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  const resizeObserver = new ResizeObserver(onResize);
  resizeObserver.observe(canvas.parentElement || document.body);

  /* ──────────────────────────────────────────────────────────
     VISIBILITY API – pause when tab hidden
  ────────────────────────────────────────────────────────── */
  let isPaused = false;
  document.addEventListener('visibilitychange', () => {
    isPaused = document.hidden;
    if (!isPaused) animate();
  });

  /* ──────────────────────────────────────────────────────────
     ANIMATION LOOP
  ────────────────────────────────────────────────────────── */
  const clock = new THREE.Clock();
  let animId = null;

  function animate() {
    if (isPaused) return;
    animId = requestAnimationFrame(animate);

    const elapsed = clock.getElapsedTime();

    /* Smooth mouse lerp */
    mouse.x += (targetMouse.x - mouse.x) * 0.05;
    mouse.y += (targetMouse.y - mouse.y) * 0.05;

    /* ── Move particles ── */
    const pos = particleGeo.attributes.position.array;
    for (let i = 0; i < CFG.particleCount; i++) {
      pos[i * 3]     += particleVelocities[i].x;
      pos[i * 3 + 1] += particleVelocities[i].y;
      pos[i * 3 + 2] += particleVelocities[i].z;

      /* Wrap around boundaries */
      if (pos[i * 3]     >  400) pos[i * 3]     = -400;
      if (pos[i * 3]     < -400) pos[i * 3]     =  400;
      if (pos[i * 3 + 1] >  300) pos[i * 3 + 1] = -300;
      if (pos[i * 3 + 1] < -300) pos[i * 3 + 1] =  300;
      if (pos[i * 3 + 2] >  150) pos[i * 3 + 2] = -150;
      if (pos[i * 3 + 2] < -150) pos[i * 3 + 2] =  150;
    }
    particleGeo.attributes.position.needsUpdate = true;

    /* ── Update connections ── */
    updateConnections();

    /* ── Rotate whole particle field slowly ── */
    particleMesh.rotation.y += CFG.rotationSpeed;
    particleMesh.rotation.x  = mouse.y * 0.04;

    /* ── Animate shapes ── */
    shapeMeshes.forEach((mesh) => {
      const ud = mesh.userData;
      mesh.rotation.x += ud.rotSpeed.x;
      mesh.rotation.y += ud.rotSpeed.y;
      mesh.rotation.z += ud.rotSpeed.z;

      /* Gentle vertical float */
      mesh.position.y = ud.baseY + Math.sin(elapsed * ud.floatSpeed + ud.floatOffset) * 18;
    });

    /* ── Camera mouse parallax ── */
    if (!SIMPLIFIED) {
      camera.position.x += (mouse.x * 30 - camera.position.x) * 0.03;
      camera.position.y += (-mouse.y * 20 - camera.position.y) * 0.03;
      camera.lookAt(scene.position);
    }

    renderer.render(scene, camera);
  }

  /* ──────────────────────────────────────────────────────────
     INIT – wait for DOM paint then start
  ────────────────────────────────────────────────────────── */
  requestAnimationFrame(() => {
    onResize();
    animate();
  });

  /* ──────────────────────────────────────────────────────────
     CLEANUP helper (exposed globally for teardown if needed)
  ────────────────────────────────────────────────────────── */
  window.__threeBgCleanup = function () {
    if (animId) cancelAnimationFrame(animId);
    resizeObserver.disconnect();
    renderer.dispose();
  };

})();
