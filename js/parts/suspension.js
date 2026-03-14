// ============================================================
//  Suspension parts — wishbones, pushrods, pullrods
//  Color: #264653 (dark teal)
// ============================================================

import * as THREE from 'three';
import { createWishbone, addEdgeLines } from '../geometry/factories.js';

const GROUP = 'suspension';
const COLOR = '#264653';

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

/**
 * Helper: builds a wishbone for a given corner.
 * Connects from chassis mounting points inboard to wheel upright outboard.
 * side: -1 = left, +1 = right
 */
function buildFrontWishbone(side, isUpper) {
  // Front wheels at X = ±0.9, chassis mounts at X = ±0.25
  const yOffset = isUpper ? 0.05 : -0.05;
  const apex = new THREE.Vector3(side * 0.65, 0, 0);  // upright end (outboard)
  const mountFore = new THREE.Vector3(side * 0.12, yOffset, -0.15);  // chassis fore mount
  const mountAft = new THREE.Vector3(side * 0.12, yOffset, 0.15);   // chassis aft mount
  const wb = createWishbone(apex, mountFore, mountAft, 0.01);

  wb.traverse((child) => {
    if (child.isMesh) {
      child.material = mat({ metalness: 0.6, roughness: 0.25 });
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
  return wb;
}

function buildRearWishbone(side, isUpper) {
  // Rear wheels at X = ±0.85, gearbox mounts at X = ±0.14
  const yOffset = isUpper ? 0.05 : -0.05;
  const apex = new THREE.Vector3(side * 0.6, 0, 0);
  const mountFore = new THREE.Vector3(side * 0.12, yOffset, -0.15);
  const mountAft = new THREE.Vector3(side * 0.12, yOffset, 0.15);
  const wb = createWishbone(apex, mountFore, mountAft, 0.01);

  wb.traverse((child) => {
    if (child.isMesh) {
      child.material = mat({ metalness: 0.6, roughness: 0.25 });
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
  return wb;
}

/**
 * Helper: builds a pushrod or pullrod
 */
function buildRod(side, isPushrod) {
  const group = new THREE.Group();

  const length = 0.25;
  const rodGeo = new THREE.CylinderGeometry(0.007, 0.007, length, 8);
  const rod = new THREE.Mesh(rodGeo, mat({ metalness: 0.6, roughness: 0.2 }));
  rod.castShadow = true;
  rod.receiveShadow = true;
  addEdgeLines(rod);
  group.add(rod);

  // Small spherical bearing at each end
  const bearingGeo = new THREE.SphereGeometry(0.01, 12, 8);
  const bearing1 = new THREE.Mesh(bearingGeo, mat({ metalness: 0.7 }));
  bearing1.position.y = length / 2;
  bearing1.castShadow = true;
  group.add(bearing1);

  const bearing2 = new THREE.Mesh(bearingGeo.clone(), mat({ metalness: 0.7 }));
  bearing2.position.y = -length / 2;
  bearing2.castShadow = true;
  group.add(bearing2);

  if (isPushrod) {
    group.rotation.z = side * 0.5;
    group.rotation.x = 0.2;
  } else {
    group.rotation.z = side * -0.4;
    group.rotation.x = -0.15;
  }

  return group;
}

export const suspensionParts = [
  // ---- Front Upper Wishbone Left ----------------------------
  {
    id: 'frontUpperWishboneLeft',
    name: 'Front Upper Wishbone (Left)',
    group: GROUP,
    description: 'Left front upper A-arm controlling camber and caster geometry of the front-left wheel.',
    assembledPosition: [-0.55, 0.38, -1.5],
    assembledRotation: [0, 0, 0],
    explosionDirection: [-0.8, 0.4, -0.3],
    build() {
      return buildFrontWishbone(-1, true);
    },
  },

  // ---- Front Upper Wishbone Right ---------------------------
  {
    id: 'frontUpperWishboneRight',
    name: 'Front Upper Wishbone (Right)',
    group: GROUP,
    description: 'Right front upper A-arm controlling camber and caster geometry of the front-right wheel.',
    assembledPosition: [0.55, 0.38, -1.5],
    assembledRotation: [0, 0, 0],
    explosionDirection: [0.8, 0.4, -0.3],
    build() {
      return buildFrontWishbone(1, true);
    },
  },

  // ---- Front Lower Wishbone Left ----------------------------
  {
    id: 'frontLowerWishboneLeft',
    name: 'Front Lower Wishbone (Left)',
    group: GROUP,
    description: 'Left front lower A-arm — primary load-bearing suspension link at the front-left corner.',
    assembledPosition: [-0.55, 0.18, -1.5],
    assembledRotation: [0, 0, 0],
    explosionDirection: [-0.8, -0.4, -0.3],
    build() {
      return buildFrontWishbone(-1, false);
    },
  },

  // ---- Front Lower Wishbone Right ---------------------------
  {
    id: 'frontLowerWishboneRight',
    name: 'Front Lower Wishbone (Right)',
    group: GROUP,
    description: 'Right front lower A-arm — primary load-bearing suspension link at the front-right corner.',
    assembledPosition: [0.55, 0.18, -1.5],
    assembledRotation: [0, 0, 0],
    explosionDirection: [0.8, -0.4, -0.3],
    build() {
      return buildFrontWishbone(1, false);
    },
  },

  // ---- Rear Upper Wishbone Left -----------------------------
  {
    id: 'rearUpperWishboneLeft',
    name: 'Rear Upper Wishbone (Left)',
    group: GROUP,
    description: 'Left rear upper A-arm controlling camber geometry of the rear-left wheel.',
    assembledPosition: [-0.5, 0.35, 2.1],
    assembledRotation: [0, 0, 0],
    explosionDirection: [-0.8, 0.4, 0.3],
    build() {
      return buildRearWishbone(-1, true);
    },
  },

  // ---- Rear Upper Wishbone Right ----------------------------
  {
    id: 'rearUpperWishboneRight',
    name: 'Rear Upper Wishbone (Right)',
    group: GROUP,
    description: 'Right rear upper A-arm controlling camber geometry of the rear-right wheel.',
    assembledPosition: [0.5, 0.35, 2.1],
    assembledRotation: [0, 0, 0],
    explosionDirection: [0.8, 0.4, 0.3],
    build() {
      return buildRearWishbone(1, true);
    },
  },

  // ---- Rear Lower Wishbone Left -----------------------------
  {
    id: 'rearLowerWishboneLeft',
    name: 'Rear Lower Wishbone (Left)',
    group: GROUP,
    description: 'Left rear lower A-arm — primary load-bearing suspension link at the rear-left corner.',
    assembledPosition: [-0.5, 0.15, 2.1],
    assembledRotation: [0, 0, 0],
    explosionDirection: [-0.8, -0.4, 0.3],
    build() {
      return buildRearWishbone(-1, false);
    },
  },

  // ---- Rear Lower Wishbone Right ----------------------------
  {
    id: 'rearLowerWishboneRight',
    name: 'Rear Lower Wishbone (Right)',
    group: GROUP,
    description: 'Right rear lower A-arm — primary load-bearing suspension link at the rear-right corner.',
    assembledPosition: [0.5, 0.15, 2.1],
    assembledRotation: [0, 0, 0],
    explosionDirection: [0.8, -0.4, 0.3],
    build() {
      return buildRearWishbone(1, false);
    },
  },

  // ---- Front Pushrod Left -----------------------------------
  {
    id: 'frontPushrodLeft',
    name: 'Front Pushrod (Left)',
    group: GROUP,
    description: 'Left front pushrod connecting the lower wishbone to the inboard torsion bar and damper.',
    assembledPosition: [-0.45, 0.3, -1.5],
    assembledRotation: [0, 0, 0],
    explosionDirection: [-0.5, 0.7, -0.3],
    build() {
      return buildRod(-1, true);
    },
  },

  // ---- Front Pushrod Right ----------------------------------
  {
    id: 'frontPushrodRight',
    name: 'Front Pushrod (Right)',
    group: GROUP,
    description: 'Right front pushrod connecting the lower wishbone to the inboard torsion bar and damper.',
    assembledPosition: [0.45, 0.3, -1.5],
    assembledRotation: [0, 0, 0],
    explosionDirection: [0.5, 0.7, -0.3],
    build() {
      return buildRod(1, true);
    },
  },

  // ---- Rear Pullrod Left ------------------------------------
  {
    id: 'rearPullrodLeft',
    name: 'Rear Pullrod (Left)',
    group: GROUP,
    description: 'Left rear pullrod — lower-mounted linkage for compact rear suspension packaging.',
    assembledPosition: [-0.45, 0.22, 2.1],
    assembledRotation: [0, 0, 0],
    explosionDirection: [-0.5, -0.5, 0.5],
    build() {
      return buildRod(-1, false);
    },
  },

  // ---- Rear Pullrod Right -----------------------------------
  {
    id: 'rearPullrodRight',
    name: 'Rear Pullrod (Right)',
    group: GROUP,
    description: 'Right rear pullrod — lower-mounted linkage for compact rear suspension packaging.',
    assembledPosition: [0.45, 0.22, 2.1],
    assembledRotation: [0, 0, 0],
    explosionDirection: [0.5, -0.5, 0.5],
    build() {
      return buildRod(1, false);
    },
  },
];
