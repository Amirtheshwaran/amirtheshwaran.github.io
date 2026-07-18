// scene.js — Three.js world: instanced panels, poses, camera, lights.
// Pose indices: 0 scattered · 1 monolith · 2 splitCore · 3 grid · 4 helix · 5 screens · 6 beacon
// main.js drives everything through the returned api: blend(a, b, t), setSpin(v), setPointer(x, y).

import * as THREE from 'three';

const GOLD = 0xd4a853;

// Deterministic pseudo-random so poses are stable across reloads.
function rnd(i) {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function makePanelPoses(N, ax) {
  // Each pose: { p: Vector3[], q: Quaternion[], s: number[] }
  const euler = new THREE.Euler();
  const pose = () => ({ p: [], q: [], s: [] });
  const push = (P, x, y, z, rx, ry, rz, s) => {
    P.p.push(new THREE.Vector3(x, y, z));
    P.q.push(new THREE.Quaternion().setFromEuler(euler.set(rx, ry, rz)));
    P.s.push(s);
  };

  // 0 — scattered: random cloud far out (hero assembles from this)
  const scattered = pose();
  for (let i = 0; i < N; i++) {
    const th = rnd(i) * Math.PI * 2, ph = Math.acos(2 * rnd(i + 50) - 1);
    const r = 9 + rnd(i + 100) * 6;
    push(scattered,
      r * Math.sin(ph) * Math.cos(th), r * Math.cos(ph) * 0.7, r * Math.sin(ph) * Math.sin(th) - 4,
      rnd(i + 150) * 6, rnd(i + 200) * 6, rnd(i + 250) * 6, 0.5 + rnd(i + 300) * 0.5);
  }

  // 1 — monolith: 2 cols × 2 layers × rows slab, standing at center
  const monolith = pose();
  const rows = Math.ceil(N / 4);
  for (let i = 0; i < N; i++) {
    const col = i % 2, layer = Math.floor(i / 2) % 2, row = Math.floor(i / 4);
    push(monolith,
      (col - 0.5) * 1.18 + (rnd(i) - 0.5) * 0.02,
      (row - (rows - 1) / 2) * 0.66,
      (layer - 0.5) * 0.1,
      0, (rnd(i + 40) - 0.5) * 0.03, 0, 1);
  }

  // 2 — splitCore: two halves swing apart like a book, gold core revealed
  const split = pose();
  for (let i = 0; i < N; i++) {
    const col = i % 2, layer = Math.floor(i / 2) % 2, row = Math.floor(i / 4);
    const side = col === 0 ? -1 : 1;
    push(split,
      side * (1.7 + layer * 0.35) + ax * -2.4,
      (row - (rows - 1) / 2) * 0.72,
      -0.4 - layer * 0.15 + rnd(i) * 0.1,
      0, side * 0.85, (rnd(i + 60) - 0.5) * 0.1, 1);
  }

  // 3 — grid: six floating shelves (one per stack category)
  const grid = pose();
  const perRow = Math.ceil(N / 6);
  for (let i = 0; i < N; i++) {
    const r = i % 6, c = Math.floor(i / 6);
    push(grid,
      (c - (perRow - 1) / 2) * 1.5 + ax * 2.4,
      (2.5 - r) * 1.12,
      (rnd(i) - 0.5) * 0.6,
      -1.15 + (rnd(i + 70) - 0.5) * 0.1, (rnd(i + 80) - 0.5) * 0.15, 0, 0.9);
  }

  // 4 — helix: panels spiral down a vertical axis
  const helix = pose();
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1);
    const ang = t * Math.PI * 3.5;
    push(helix,
      Math.cos(ang) * 2.3 + ax * 2.6,
      3.2 - 6.4 * t,
      Math.sin(ang) * 2.3,
      0, -ang + Math.PI / 2, 0.12, 0.95);
  }

  // 5 — screens: four large floating panels-of-panels (featured projects)
  const screens = pose();
  const cx = [-3.4, 3.4, -3.4, 3.4], cy = [1.85, 1.85, -1.85, -1.85];
  for (let i = 0; i < N; i++) {
    const cluster = i % 4, k = Math.floor(i / 4);
    const colc = k % 5, rowc = Math.floor(k / 5);
    push(screens,
      cx[cluster] * (0.55 + ax * 0.45) + (colc - 2) * 1.18,
      cy[cluster] + (0.5 - rowc) * 0.78,
      (rnd(i) - 0.5) * 0.15 - 1,
      0, cx[cluster] < 0 ? 0.22 : -0.22, 0, 1);
  }

  // 6 — beacon: everything collapses into a dense glowing cluster
  const beacon = pose();
  for (let i = 0; i < N; i++) {
    const th = rnd(i + 11) * Math.PI * 2, ph = Math.acos(2 * rnd(i + 22) - 1);
    const r = 0.8 + rnd(i + 33) * 0.55;
    push(beacon,
      r * Math.sin(ph) * Math.cos(th),
      r * Math.cos(ph) + 0.2,
      r * Math.sin(ph) * Math.sin(th),
      rnd(i + 44) * 6, rnd(i + 55) * 6, rnd(i + 66) * 6, 0.42);
  }

  return [scattered, monolith, split, grid, helix, screens, beacon];
}

// Per-pose camera { pos, look } and core { s: scale, o: opacity, li: gold light intensity }
function makeCamPoses(ax, zf) {
  const v = (x, y, z) => new THREE.Vector3(x, y, z);
  return [
    { pos: v(0, 0, 16 * zf),        look: v(0, 0, 0),            core: { s: 0.001, o: 0,   li: 0.3 } },
    { pos: v(0, 0.4, 10.5 * zf),    look: v(0, 0, 0),            core: { s: 0.001, o: 0,   li: 0.5 } },
    { pos: v(ax * -1.2, 0.5, 9.5 * zf), look: v(ax * -2.4, 0, 0), core: { s: 0.6,  o: 0.9, li: 2.4 } },
    { pos: v(ax * 1.6, 1.3, 11 * zf),   look: v(ax * 2.4, 0, 0),  core: { s: 0.22, o: 0.4, li: 1.2 } },
    { pos: v(ax * 2.2, -0.3, 9.5 * zf), look: v(ax * 2.6, -0.2, 0), core: { s: 0.28, o: 0.5, li: 1.6 } },
    { pos: v(0, 0, 13 * zf),        look: v(0, 0, 0),            core: { s: 0.001, o: 0,   li: 0.9 } },
    { pos: v(0, 0.5, 12 * zf),      look: v(0, 0.2, 0),          core: { s: 1.15, o: 1,   li: 3.4 } },
  ];
}

export function initScene(canvas, opts = {}) {
  const mobile = !!opts.mobile;
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch (e) {
    return null;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, mobile ? 1.5 : 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 100);

  const N = mobile ? 20 : 40;
  const ax = mobile ? 0.3 : 1;      // horizontal anchor scale (poses hug center on phones)
  const zf = mobile ? 1.3 : 1;      // camera pushed back on narrow aspect
  const poses = makePanelPoses(N, ax);
  const camPoses = makeCamPoses(ax, zf);

  // Lights
  scene.add(new THREE.AmbientLight(0xffffff, 0.35));
  const key = new THREE.DirectionalLight(0xdfe6ff, 1.6);
  key.position.set(5, 8, 6);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x33427a, 1.1);
  rim.position.set(-6, -3, -8);
  scene.add(rim);
  const goldLight = new THREE.PointLight(GOLD, 0.5, 30, 1.6);
  scene.add(goldLight);

  const group = new THREE.Group();
  scene.add(group);

  // Panels — one instanced mesh, one draw call
  const panelGeo = new THREE.BoxGeometry(1.15, 0.62, 0.07);
  const panelMat = new THREE.MeshStandardMaterial({ color: 0x10131f, metalness: 0.65, roughness: 0.28 });
  const panels = new THREE.InstancedMesh(panelGeo, panelMat, N);
  panels.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  group.add(panels);

  // Gold edge strips riding each panel's bottom-front edge
  const stripGeo = new THREE.BoxGeometry(1.15, 0.025, 0.025);
  const stripMat = new THREE.MeshBasicMaterial({ color: GOLD });
  const strips = new THREE.InstancedMesh(stripGeo, stripMat, N);
  strips.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  group.add(strips);
  const stripOffset = new THREE.Matrix4().makeTranslation(0, -0.3, 0.05);

  // Gold core (revealed in splitCore / beacon poses)
  const core = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.5, 1),
    new THREE.MeshBasicMaterial({ color: GOLD, transparent: true, opacity: 0 })
  );
  scene.add(core);

  // ── Blend state ──
  const state = { a: 0, b: 0, t: 0 };
  let spin = 0;
  const pointer = { x: 0, y: 0, sx: 0, sy: 0 };

  const _m = new THREE.Matrix4(), _m2 = new THREE.Matrix4();
  const _p = new THREE.Vector3(), _q = new THREE.Quaternion(), _s = new THREE.Vector3();
  const _cam = new THREE.Vector3(), _look = new THREE.Vector3();

  function apply() {
    const A = poses[state.a], B = poses[state.b], t = state.t;
    for (let i = 0; i < N; i++) {
      _p.lerpVectors(A.p[i], B.p[i], t);
      _q.slerpQuaternions(A.q[i], B.q[i], t);
      const sc = A.s[i] + (B.s[i] - A.s[i]) * t;
      _s.set(sc, sc, sc);
      _m.compose(_p, _q, _s);
      panels.setMatrixAt(i, _m);
      _m2.multiplyMatrices(_m, stripOffset);
      strips.setMatrixAt(i, _m2);
    }
    panels.instanceMatrix.needsUpdate = true;
    strips.instanceMatrix.needsUpdate = true;

    const cA = camPoses[state.a], cB = camPoses[state.b];
    _cam.lerpVectors(cA.pos, cB.pos, t);
    _look.lerpVectors(cA.look, cB.look, t);
    const cs = cA.core.s + (cB.core.s - cA.core.s) * t;
    core.scale.setScalar(cs);
    core.position.copy(_look);
    core.material.opacity = cA.core.o + (cB.core.o - cA.core.o) * t;
    goldLight.intensity = cA.core.li + (cB.core.li - cA.core.li) * t;
    goldLight.position.set(_look.x, _look.y, _look.z + 1.5);
  }

  function frame(time) {
    const t = time * 0.001;
    // Idle drift + scroll spin — group-level, cheap
    group.rotation.y = spin + Math.sin(t * 0.1) * 0.05;
    group.rotation.x = Math.sin(t * 0.13) * 0.02;
    group.position.y = Math.sin(t * 0.4) * 0.05;
    core.rotation.y = t * 0.4;
    core.rotation.x = t * 0.25;
    // Smoothed mouse parallax on the camera
    pointer.sx += (pointer.x - pointer.sx) * 0.05;
    pointer.sy += (pointer.y - pointer.sy) * 0.05;
    camera.position.set(_cam.x + pointer.sx * 0.6, _cam.y - pointer.sy * 0.4, _cam.z);
    camera.lookAt(_look);
    renderer.render(scene, camera);
  }

  let running = false;
  function loop(time) {
    if (!running) return;
    frame(time);
    requestAnimationFrame(loop);
  }

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    if (!running) frame(performance.now());
  });

  apply();

  return {
    poseCount: poses.length,
    blend(a, b, t) {
      state.a = a; state.b = b; state.t = Math.min(1, Math.max(0, t));
      apply();
    },
    setSpin(v) { spin = v; },
    setPointer(x, y) { pointer.x = x; pointer.y = y; },
    start() {
      if (running) return;
      running = true;
      requestAnimationFrame(loop);
    },
    renderOnce() { frame(performance.now()); },
  };
}
