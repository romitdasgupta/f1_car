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

// Corner positions — [X, Y, Z]
const CORNERS = {
  FL: { x: -0.85, z: -2.0, label: 'Front-Left' },
  FR: { x:  0.85, z: -2.0, label: 'Front-Right' },
  RL: { x: -0.85, z:  2.3, label: 'Rear-Left' },
  RR: { x:  0.85, z:  2.3, label: 'Rear-Right' },
};

// Tire dimensions
const FRONT_TIRE_R = 0.33;
const REAR_TIRE_R  = 0.33;
const FRONT_TIRE_W = 0.26;
const REAR_TIRE_W  = 0.32;

/**
 * Builds a tire (torus) for the given corner.
 */
function buildTire(cornerKey) {
  const isRear = cornerKey.startsWith('R');
  const radius = isRear ? REAR_TIRE_R : FRONT_TIRE_R;
  const width = isRear ? REAR_TIRE_W : FRONT_TIRE_W;
  const tubeR = width / 2;

  const geo = new THREE.TorusGeometry(radius, tubeR, 24, 48);
  const mesh = new THREE.Mesh(geo, mat({
    color: '#1A1A1A',
    metalness: 0.05,
    roughness: 0.9,
    clearcoat: 0.05,
    opacity: 0.9,
  }));
  mesh.rotation.y = Math.PI / 2;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  addEdgeLines(mesh, '#333333');
  return mesh;
}

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
  const mesh = new THREE.Mesh(geo, mat({
    color: '#CCCCCC',
    metalness: 0.85,
    roughness: 0.15,
    clearcoat: 0.5,
  }));
  mesh.rotation.x = Math.PI / 2;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  addEdgeLines(mesh, '#888888');
  return mesh;
}

/**
 * Builds a brake assembly (disc + caliper) for the given corner.
 */
function buildBrake(cornerKey) {
  const isRear = cornerKey.startsWith('R');
  const tireR = isRear ? REAR_TIRE_R : FRONT_TIRE_R;
  const group = new THREE.Group();

  // Brake disc
  const discR = tireR * 0.6;
  const discGeo = new THREE.CylinderGeometry(discR, discR, 0.025, 36);
  const disc = new THREE.Mesh(discGeo, mat({
    color: '#888888',
    metalness: 0.75,
    roughness: 0.3,
  }));
  disc.rotation.x = Math.PI / 2;
  disc.castShadow = true;
  disc.receiveShadow = true;
  addEdgeLines(disc);
  group.add(disc);

  // Ventilation holes in disc (decorative small cylinders subtracted visually)
  const holeCount = 12;
  const holeR = 0.008;
  for (let i = 0; i < holeCount; i++) {
    const angle = (i / holeCount) * Math.PI * 2;
    const hx = Math.cos(angle) * discR * 0.65;
    const hy = Math.sin(angle) * discR * 0.65;
    const holeGeo = new THREE.CylinderGeometry(holeR, holeR, 0.03, 6);
    const hole = new THREE.Mesh(holeGeo, mat({
      color: '#333333',
      metalness: 0.5,
      opacity: 0.6,
    }));
    hole.position.set(hx, hy, 0);
    hole.rotation.x = Math.PI / 2;
    group.add(hole);
  }

  // Brake caliper
  const caliperW = discR * 0.35;
  const caliperH = discR * 0.25;
  const caliperD = 0.06;
  const caliperGeo = new THREE.BoxGeometry(caliperW, caliperH, caliperD);
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
