import * as THREE from 'three';
import { surfaceMaps } from './textures';

/**
 * Twin-engine transport aircraft for the opening cinematic, built in code to match the level 1 wreck
 * (14 m fuselage, 1.1 m radius). Faces +Z. Exposes the propellers (to spin) and the right engine's
 * exhaust point (to attach fire and smoke).
 */
export function buildPlane() {
  const group = new THREE.Group();
  const metal = surfaceMaps('metal');
  const white = new THREE.MeshStandardMaterial({ color: 0xe8e6e0, roughness: 0.45, metalness: 0.2, normalMap: metal.normalMap });
  const blue = new THREE.MeshStandardMaterial({ color: 0x1f4f8f, roughness: 0.5, metalness: 0.1 });
  const glass = new THREE.MeshStandardMaterial({ color: 0x1a222b, roughness: 0.15, metalness: 0.5 });
  const grey = new THREE.MeshStandardMaterial({ color: 0x7d8086, roughness: 0.5, metalness: 0.4 });
  const prop = new THREE.MeshBasicMaterial({ color: 0x222222, transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false });
  const add = (geo: THREE.BufferGeometry, mat: THREE.Material, x = 0, y = 0, z = 0) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.castShadow = true;
    group.add(m);
    return m;
  };

  // Fuselage: lathe profile from tail (z = -7) to nose (z = +7), rotated to lie along Z.
  const profile: THREE.Vector2[] = [];
  const L = 14, R = 1.1;
  for (let i = 0; i <= 24; i++) {
    const t = i / 24; // 0 = tail, 1 = nose
    let r = R;
    if (t < 0.28) r = R * (0.25 + 0.75 * Math.sin((t / 0.28) * Math.PI / 2)); // tail taper
    if (t > 0.88) r = R * Math.sqrt(Math.max(0, 1 - ((t - 0.88) / 0.12) ** 2)) ; // rounded nose
    profile.push(new THREE.Vector2(Math.max(0.001, r), (t - 0.5) * L));
  }
  const body = new THREE.LatheGeometry(profile, 28);
  body.rotateX(Math.PI / 2);
  add(body, white).position.y = 0;
  // Tail rises: tilt the tail cone slightly by adding a fairing.
  const stripe = new THREE.CylinderGeometry(R * 1.005, R * 1.005, L * 0.6, 28, 1, true, Math.PI * 0.35, Math.PI * 0.3);
  stripe.rotateX(Math.PI / 2);
  add(stripe, blue, 0, 0, 0.6).rotation.z = Math.PI / 2;
  const stripe2 = stripe.clone();
  add(stripe2, blue, 0, 0, 0.6).rotation.z = -Math.PI / 2;
  // Cockpit windows and passenger windows.
  const cockpit = new THREE.CylinderGeometry(R * 1.01, R * 1.01, 0.5, 20, 1, true, -Math.PI * 0.3, Math.PI * 0.6);
  cockpit.rotateX(Math.PI / 2);
  add(cockpit, glass, 0, 0.35, 5.6).rotation.z = 0;
  for (const side of [-1, 1])
    for (let k = 0; k < 9; k++) add(new THREE.BoxGeometry(0.05, 0.32, 0.26), glass, side * R * 0.99, 0.28, 3.6 - k * 0.85);

  // Wings (tapered, slight dihedral) with engine nacelles and propellers.
  // Build each wing from its own shape (mirroring with a negative scale would flip the faces inside-out).
  const wingGeo = (side: number) => {
    const shape = new THREE.Shape();
    const pts: [number, number][] = [[0, 0], [7.5, 0.9], [7.5, 1.9], [0, 2.8]];
    const ordered = side > 0 ? pts : [...pts].reverse();
    shape.moveTo(ordered[0][0] * side, ordered[0][1]);
    for (const [x, y] of ordered.slice(1)) shape.lineTo(x * side, y);
    const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.22, bevelEnabled: false });
    geo.rotateX(Math.PI / 2);
    return geo;
  };
  const propellers: THREE.Mesh[] = [];
  let exhaust = new THREE.Vector3();
  for (const side of [-1, 1]) {
    const w = add(wingGeo(side), white, side * 0.6, 0.15, 1.4);
    w.rotation.z = side * 0.05;
    const nx = side * 2.8;
    add(new THREE.CylinderGeometry(0.42, 0.5, 2.6, 16).rotateX(Math.PI / 2), grey, nx, 0.0, 1.9);
    add(new THREE.ConeGeometry(0.2, 0.45, 12).rotateX(Math.PI / 2), grey, nx, 0.0, 3.35);
    const p = add(new THREE.CircleGeometry(1.35, 24), prop, nx, 0.0, 3.25);
    p.renderOrder = 4;
    propellers.push(p);
    if (side === 1) exhaust = new THREE.Vector3(nx, 0.2, 0.9);
  }
  // Tail: fin and stabilisers.
  const fin = new THREE.Shape();
  fin.moveTo(0, 0); fin.lineTo(2.4, 0); fin.lineTo(1.0, 2.6); fin.lineTo(0.2, 2.6); fin.lineTo(0, 0);
  const finGeo = new THREE.ExtrudeGeometry(fin, { depth: 0.16, bevelEnabled: false });
  finGeo.rotateY(Math.PI / 2);
  add(finGeo, white, -0.08, 0.3, -4.4);
  add(new THREE.BoxGeometry(5.2, 0.12, 1.3), white, 0, 0.35, -5.6);
  add(new THREE.BoxGeometry(0.17, 0.9, 1.0), blue, 0, 2.25, -5.9);

  return { group, propellers, exhaust };
}
