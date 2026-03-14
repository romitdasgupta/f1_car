// ============================================================
//  Wheels & Brakes — tires, rims, brake assemblies at 4 corners
//  Color: #A8DADC (light cyan)
// ============================================================

import * as THREE from 'three';
import { addEdgeLines } from '../geometry/factories.js';

const GROUP = 'wheelsAndBrakes';
const COLOR = '#A8DADC';

function mat(opts = {}) {
  return new THREE.MeshPhysicalMaterial({
    color: COLOR,
    metalness: 0.15,
    roughness: 0.4,
    clearcoat: 0.3,
    transparent: true,
    opacity: 0.85,
    ...opts,
  });
}

// Corner positions — correct F1 proportions
// Front track width: ~1.8 (wheels at ±0.9)
// Rear track width: ~1.7 (wheels at ±0.85)
// Front axle at Z = -1.5, rear axle at Z = +2.1
const CORNERS = {
  FL: { x: -0.9, z: -1.5, label: 'Front-Left' },
  FR: { x:  0.9, z: -1.5, label: 'Front-Right' },
  RL: { x: -0.85, z:  2.1, label: 'Rear-Left' },
  RR: { x:  0.85, z:  2.1, label: 'Rear-Right' },
};

// Tire dimensions — 18" wheels
const FRONT_TIRE_R = 0.33;
const REAR_TIRE_R  = 0.33;
const FRONT_TIRE_W = 0.305;
const REAR_TIRE_W  = 0.38;

// All wheel components use rotateZ(PI/2) to align revolution/cylinder axis Y → X (wheel axle)
const AXLE_ROTATION = Math.PI / 2;

// ---- Sidewall branding texture (shared, created once) ------

let _brandingTexture = null;
function getSidewallTexture() {
  if (_brandingTexture) return _brandingTexture;

  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  // Black rubber background
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(0, 0, 2048, 256);

  // Compound color stripe at top and bottom edges
  ctx.fillStyle = '#FFCC00';
  ctx.fillRect(0, 0, 2048, 12);
  ctx.fillRect(0, 244, 2048, 12);

  // Branding text repeated around the circumference (4 segments)
  const segments = 4;
  const segW = 2048 / segments;
  for (let i = 0; i < segments; i++) {
    const cx = segW * (i + 0.5);
    if (i % 2 === 0) {
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 68px Arial, Helvetica, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('P I R E L L I', cx, 128);
    } else {
      ctx.fillStyle = '#FFCC00';
      ctx.font = 'bold 52px Arial, Helvetica, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('P ZERO', cx, 110);
      // Small compound label
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '28px Arial, Helvetica, sans-serif';
      ctx.fillText('SOFT', cx, 160);
    }
  }

  _brandingTexture = new THREE.CanvasTexture(canvas);
  _brandingTexture.wrapS = THREE.RepeatWrapping;
  _brandingTexture.wrapT = THREE.ClampToEdgeWrapping;
  return _brandingTexture;
}

// ---- Tire builder ------------------------------------------

/**
 * Builds a tire with realistic cross-section, compound bands, and sidewall branding.
 */
function buildTire(cornerKey) {
  const isRear = cornerKey.startsWith('R');
  const outerR = isRear ? REAR_TIRE_R : FRONT_TIRE_R;
  const width = isRear ? REAR_TIRE_W : FRONT_TIRE_W;
  const halfW = width / 2;
  // Inner radius (bead) — 18" low-profile, short sidewall
  const innerR = outerR * 0.63;

  const group = new THREE.Group();

  // === Main tire body (LatheGeometry with proper cross-section) ===
  // Low-profile 18" F1 tire: wide flat tread, short near-vertical sidewalls
  const profile = [
    // Bead (inner edge, slightly narrower than tread)
    new THREE.Vector2(innerR, -halfW * 0.88),
    new THREE.Vector2(innerR + 0.005, -halfW * 0.85),
    // Short sidewall — nearly vertical
    new THREE.Vector2(innerR + (outerR - innerR) * 0.15, -halfW * 0.82),
    new THREE.Vector2(innerR + (outerR - innerR) * 0.50, -halfW * 0.74),
    new THREE.Vector2(innerR + (outerR - innerR) * 0.80, -halfW * 0.62),
    new THREE.Vector2(outerR * 0.97, -halfW * 0.52),
    // Shoulder — sharp transition to tread
    new THREE.Vector2(outerR, -halfW * 0.44),
    new THREE.Vector2(outerR + 0.001, -halfW * 0.38),
    // Wide flat tread (~76% of width)
    new THREE.Vector2(outerR + 0.002, -halfW * 0.25),
    new THREE.Vector2(outerR + 0.003, 0),
    new THREE.Vector2(outerR + 0.002, halfW * 0.25),
    // Shoulder (mirror)
    new THREE.Vector2(outerR + 0.001, halfW * 0.38),
    new THREE.Vector2(outerR, halfW * 0.44),
    // Sidewall (mirror)
    new THREE.Vector2(outerR * 0.97, halfW * 0.52),
    new THREE.Vector2(innerR + (outerR - innerR) * 0.80, halfW * 0.62),
    new THREE.Vector2(innerR + (outerR - innerR) * 0.50, halfW * 0.74),
    new THREE.Vector2(innerR + (outerR - innerR) * 0.15, halfW * 0.82),
    // Bead (mirror)
    new THREE.Vector2(innerR + 0.005, halfW * 0.85),
    new THREE.Vector2(innerR, halfW * 0.88),
  ];

  const tireGeo = new THREE.LatheGeometry(profile, 48);
  tireGeo.rotateZ(AXLE_ROTATION);

  const tireMesh = new THREE.Mesh(tireGeo, mat({
    color: '#1A1A1A',
    metalness: 0.05,
    roughness: 0.85,
    clearcoat: 0.05,
    opacity: 0.95,
  }));
  tireMesh.castShadow = true;
  tireMesh.receiveShadow = true;
  addEdgeLines(tireMesh, '#333333');
  group.add(tireMesh);

  // === Sidewall branding (canvas texture on RingGeometry) ===
  const brandInner = innerR + (outerR - innerR) * 0.08;
  const brandOuter = innerR + (outerR - innerR) * 0.65;

  for (const side of [-1, 1]) {
    const ringGeo = new THREE.RingGeometry(brandInner, brandOuter, 64, 1);
    // Face the ring along the X axis (perpendicular to axle)
    ringGeo.rotateY(side * Math.PI / 2);

    const brandMat = new THREE.MeshBasicMaterial({
      map: getSidewallTexture(),
      transparent: true,
      side: THREE.FrontSide,
      depthWrite: false,
      opacity: 0.85,
    });
    const brandMesh = new THREE.Mesh(ringGeo, brandMat);
    brandMesh.position.x = side * halfW * 0.52;
    group.add(brandMesh);
  }

  return group;
}

// ---- Rim builder -------------------------------------------

/**
 * Builds a rim (lathe geometry) for the given corner.
 */
function buildRim(cornerKey) {
  const isRear = cornerKey.startsWith('R');
  const outerR = isRear ? REAR_TIRE_R : FRONT_TIRE_R;
  const tubeR = (isRear ? REAR_TIRE_W : FRONT_TIRE_W) / 2;
  const innerR = outerR - tubeR;
  const hubR = outerR * 0.18;
  const lipR = innerR + 0.005;
  const depth = tubeR * 0.55;

  const profile = [
    new THREE.Vector2(hubR, -depth * 0.3),
    new THREE.Vector2(hubR, depth * 0.3),
    new THREE.Vector2(hubR + 0.01, depth * 0.35),
    new THREE.Vector2(innerR * 0.4, depth * 0.3),
    new THREE.Vector2(innerR * 0.7, depth * 0.15),
    new THREE.Vector2(innerR * 0.92, depth * 0.05),
    new THREE.Vector2(innerR, 0),
    new THREE.Vector2(lipR, -depth * 0.1),
    new THREE.Vector2(lipR, depth * 0.1),
    new THREE.Vector2(innerR, 0),
    new THREE.Vector2(innerR * 0.92, -depth * 0.05),
    new THREE.Vector2(innerR * 0.7, -depth * 0.15),
    new THREE.Vector2(innerR * 0.4, -depth * 0.3),
    new THREE.Vector2(hubR + 0.01, -depth * 0.35),
    new THREE.Vector2(hubR, -depth * 0.3),
  ];

  const geo = new THREE.LatheGeometry(profile, 32);
  // Align with tire: revolution axis Y → X
  geo.rotateZ(AXLE_ROTATION);
  const mesh = new THREE.Mesh(geo, mat({
    color: '#CCCCCC',
    metalness: 0.85,
    roughness: 0.15,
    clearcoat: 0.5,
  }));
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  addEdgeLines(mesh, '#888888');
  return mesh;
}

// ---- Brake builder -----------------------------------------

/**
 * Builds a brake assembly (disc + caliper) for the given corner.
 */
function buildBrake(cornerKey) {
  const isRear = cornerKey.startsWith('R');
  const tireR = isRear ? REAR_TIRE_R : FRONT_TIRE_R;
  const group = new THREE.Group();

  // Brake disc — cylinder axis aligned with wheel axle (X)
  const discR = tireR * 0.6;
  const discGeo = new THREE.CylinderGeometry(discR, discR, 0.025, 36);
  discGeo.rotateZ(AXLE_ROTATION);
  const disc = new THREE.Mesh(discGeo, mat({
    color: '#888888',
    metalness: 0.75,
    roughness: 0.3,
  }));
  disc.castShadow = true;
  disc.receiveShadow = true;
  addEdgeLines(disc);
  group.add(disc);

  // Ventilation holes — arranged in YZ plane (disc face)
  const holeCount = 12;
  const holeR = 0.008;
  for (let i = 0; i < holeCount; i++) {
    const angle = (i / holeCount) * Math.PI * 2;
    const hy = Math.cos(angle) * discR * 0.65;
    const hz = Math.sin(angle) * discR * 0.65;
    const holeGeo = new THREE.CylinderGeometry(holeR, holeR, 0.03, 6);
    holeGeo.rotateZ(AXLE_ROTATION);
    const hole = new THREE.Mesh(holeGeo, mat({
      color: '#333333',
      metalness: 0.5,
      opacity: 0.6,
    }));
    hole.position.set(0, hy, hz);
    group.add(hole);
  }

  // Brake caliper — sits at top of disc
  const caliperW = discR * 0.35;
  const caliperH = discR * 0.25;
  const caliperD = 0.06;
  const caliperGeo = new THREE.BoxGeometry(caliperD, caliperH, caliperW);
  const caliper = new THREE.Mesh(caliperGeo, mat({
    color: COLOR,
    metalness: 0.4,
    roughness: 0.35,
  }));
  caliper.position.set(0, discR * 0.8, 0);
  caliper.castShadow = true;
  caliper.receiveShadow = true;
  addEdgeLines(caliper);
  group.add(caliper);

  return group;
}

// Y position for all wheel components (centre of wheel)
const WHEEL_Y = 0.33;

export const wheelsAndBrakesParts = [
  // =============== TIRES ===============

  {
    id: 'tireFrontLeft',
    name: 'Tire (Front-Left)',
    group: GROUP,
    description: 'Front-left Pirelli pneumatic tyre — low-profile slick compound for maximum grip.',
    assembledPosition: [CORNERS.FL.x, WHEEL_Y, CORNERS.FL.z],
    assembledRotation: [0, 0, 0],
    explosionDirection: [-0.7, 0, -0.7],
    build() { return buildTire('FL'); },
  },
  {
    id: 'tireFrontRight',
    name: 'Tire (Front-Right)',
    group: GROUP,
    description: 'Front-right Pirelli pneumatic tyre — low-profile slick compound for maximum grip.',
    assembledPosition: [CORNERS.FR.x, WHEEL_Y, CORNERS.FR.z],
    assembledRotation: [0, 0, 0],
    explosionDirection: [0.7, 0, -0.7],
    build() { return buildTire('FR'); },
  },
  {
    id: 'tireRearLeft',
    name: 'Tire (Rear-Left)',
    group: GROUP,
    description: 'Rear-left Pirelli pneumatic tyre — wider compound for maximum traction under power.',
    assembledPosition: [CORNERS.RL.x, WHEEL_Y, CORNERS.RL.z],
    assembledRotation: [0, 0, 0],
    explosionDirection: [-0.7, 0, 0.7],
    build() { return buildTire('RL'); },
  },
  {
    id: 'tireRearRight',
    name: 'Tire (Rear-Right)',
    group: GROUP,
    description: 'Rear-right Pirelli pneumatic tyre — wider compound for maximum traction under power.',
    assembledPosition: [CORNERS.RR.x, WHEEL_Y, CORNERS.RR.z],
    assembledRotation: [0, 0, 0],
    explosionDirection: [0.7, 0, 0.7],
    build() { return buildTire('RR'); },
  },

  // =============== RIMS ===============

  {
    id: 'rimFrontLeft',
    name: 'Rim (Front-Left)',
    group: GROUP,
    description: 'Front-left magnesium alloy wheel rim — lightweight forged construction.',
    assembledPosition: [CORNERS.FL.x, WHEEL_Y, CORNERS.FL.z],
    assembledRotation: [0, 0, 0],
    explosionDirection: [-0.8, 0.3, -0.5],
    build() { return buildRim('FL'); },
  },
  {
    id: 'rimFrontRight',
    name: 'Rim (Front-Right)',
    group: GROUP,
    description: 'Front-right magnesium alloy wheel rim — lightweight forged construction.',
    assembledPosition: [CORNERS.FR.x, WHEEL_Y, CORNERS.FR.z],
    assembledRotation: [0, 0, 0],
    explosionDirection: [0.8, 0.3, -0.5],
    build() { return buildRim('FR'); },
  },
  {
    id: 'rimRearLeft',
    name: 'Rim (Rear-Left)',
    group: GROUP,
    description: 'Rear-left magnesium alloy wheel rim — wider to accommodate the rear tyre.',
    assembledPosition: [CORNERS.RL.x, WHEEL_Y, CORNERS.RL.z],
    assembledRotation: [0, 0, 0],
    explosionDirection: [-0.8, 0.3, 0.5],
    build() { return buildRim('RL'); },
  },
  {
    id: 'rimRearRight',
    name: 'Rim (Rear-Right)',
    group: GROUP,
    description: 'Rear-right magnesium alloy wheel rim — wider to accommodate the rear tyre.',
    assembledPosition: [CORNERS.RR.x, WHEEL_Y, CORNERS.RR.z],
    assembledRotation: [0, 0, 0],
    explosionDirection: [0.8, 0.3, 0.5],
    build() { return buildRim('RR'); },
  },

  // =============== BRAKES ===============

  {
    id: 'brakeFrontLeft',
    name: 'Brake Assembly (Front-Left)',
    group: GROUP,
    description: 'Front-left carbon-carbon brake disc and six-piston caliper — peak temperature over 1000 °C.',
    assembledPosition: [CORNERS.FL.x, WHEEL_Y, CORNERS.FL.z],
    assembledRotation: [0, 0, 0],
    explosionDirection: [-0.6, 0.6, -0.5],
    build() { return buildBrake('FL'); },
  },
  {
    id: 'brakeFrontRight',
    name: 'Brake Assembly (Front-Right)',
    group: GROUP,
    description: 'Front-right carbon-carbon brake disc and six-piston caliper — peak temperature over 1000 °C.',
    assembledPosition: [CORNERS.FR.x, WHEEL_Y, CORNERS.FR.z],
    assembledRotation: [0, 0, 0],
    explosionDirection: [0.6, 0.6, -0.5],
    build() { return buildBrake('FR'); },
  },
  {
    id: 'brakeRearLeft',
    name: 'Brake Assembly (Rear-Left)',
    group: GROUP,
    description: 'Rear-left brake assembly — smaller than front due to lower braking load and ERS regen.',
    assembledPosition: [CORNERS.RL.x, WHEEL_Y, CORNERS.RL.z],
    assembledRotation: [0, 0, 0],
    explosionDirection: [-0.6, 0.6, 0.5],
    build() { return buildBrake('RL'); },
  },
  {
    id: 'brakeRearRight',
    name: 'Brake Assembly (Rear-Right)',
    group: GROUP,
    description: 'Rear-right brake assembly — smaller than front due to lower braking load and ERS regen.',
    assembledPosition: [CORNERS.RR.x, WHEEL_Y, CORNERS.RR.z],
    assembledRotation: [0, 0, 0],
    explosionDirection: [0.6, 0.6, 0.5],
    build() { return buildBrake('RR'); },
  },
];
