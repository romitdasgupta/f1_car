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
 * side: -1 = left, +1 = right
 * verticalOffset: Y offset for upper vs lower
 */
function buildWishbone(side, zPos, verticalOffset, isUpper) {
  // Apex (upright end) is outboard; chassis mounts are inboard, spread fore/aft
  const apex = new THREE.Vector3(side * 0.65, 0, 0);
  const mountFore = new THREE.Vector3(side * 0.15, isUpper ? 0.03 : -0.03, -0.12);
  const mountAft = new THREE.Vector3(side * 0.15, isUpper ? 0.03 : -0.03, 0.12);
  const wb = createWishbone(apex, mountFore, mountAft, 0.012);

  // Override materials with group colour
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
 * Helper: builds a pushrod or pullrod — a thin rod from lower wishbone to inboard rocker.
 */
function buildRod(side, zPos, isPushrod) {
  const group = new THREE.Group();

  const length = 0.3;
  const rodGeo = new THREE.CylinderGeometry(0.008, 0.008, length, 8);
  const rod = new THREE.Mesh(rodGeo, mat({ metalness: 0.6, roughness: 0.2 }));
  rod.castShadow = true;
  rod.receiveShadow = true;
  addEdgeLines(rod);
  group.add(rod);

  // Small spherical bearing at each end
  const bearingGeo = new THREE.SphereGeometry(0.012, 12, 8);
  const bearing1 = new THREE.Mesh(bearingGeo, mat({ metalness: 0.7 }));
  bearing1.position.y = length / 2;
  bearing1.castShadow = true;
  group.add(bearing1);

  const bearing2 = new THREE.Mesh(bearingGeo.clone(), mat({ metalness: 0.7 }));
  bearing2.position.y = -length / 2;
  bearing2.castShadow = true;
  group.add(bearing2);

  // Angle: pushrods angle upward, pullrods angle downward
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
    assembledPosition: [-0.7, 0.35, -2.0],
    assembledRotation: [0, 0, 0],
    explosionDirection: [-0.8, 0.4, -0.3],
    build() {
      return buildWishbone(-1, -2.0, 0.35, true);
    },
  },

  // ---- Front Upper Wishbone Right ---------------------------
  {
    id: 'frontUpperWishboneRight',
    name: 'Front Upper Wishbone (Right)',
    group: GROUP,
    description: 'Right front upper A-arm controlling camber and caster geometry of the front-right wheel.',
    assembledPosition: [0.7, 0.35, -2.0],
    assembledRotation: [0, 0, 0],
    explosionDirection: [0.8, 0.4, -0.3],
    build() {
      return buildWishbone(1, -2.0, 0.35, true);
    },
  },

  // ---- Front Lower Wishbone Left ----------------------------
  {
    id: 'frontLowerWishboneLeft',
    name: 'Front Lower Wishbone (Left)',
    group: GROUP,
    description: 'Left front lower A-arm — primary load-bearing suspension link at the front-left corner.',
    assembledPosition: [-0.7, 0.15, -2.0],
    assembledRotation: [0, 0, 0],
    explosionDirection: [-0.8, -0.4, -0.3],
    build() {
      return buildWishbone(-1, -2.0, 0.15, false);
    },
  },

  // ---- Front Lower Wishbone Right ---------------------------
  {
    id: 'frontLowerWishboneRight',
    name: 'Front Lower Wishbone (Right)',
    group: GROUP,
    description: 'Right front lower A-arm — primary load-bearing suspension link at the front-right corner.',
    assembledPosition: [0.7, 0.15, -2.0],
    assembledRotation: [0, 0, 0],
    explosionDirection: [0.8, -0.4, -0.3],
    build() {
      return buildWishbone(1, -2.0, 0.15, false);
    },
  },

  // ---- Rear Upper Wishbone Left -----------------------------
  {
    id: 'rearUpperWishboneLeft',
    name: 'Rear Upper Wishbone (Left)',
    group: GROUP,
    description: 'Left rear upper A-arm controlling camber geometry of the rear-left wheel.',
    assembledPosition: [-0.7, 0.35, 2.3],
    assembledRotation: [0, 0, 0],
    explosionDirection: [-0.8, 0.4, 0.3],
    build() {
      return buildWishbone(-1, 2.3, 0.35, true);
    },
  },

  // ---- Rear Upper Wishbone Right ----------------------------
  {
    id: 'rearUpperWishboneRight',
    name: 'Rear Upper Wishbone (Right)',
    group: GROUP,
    description: 'Right rear upper A-arm controlling camber geometry of the rear-right wheel.',
    assembledPosition: [0.7, 0.35, 2.3],
    assembledRotation: [0, 0, 0],
    explosionDirection: [0.8, 0.4, 0.3],
    build() {
      return buildWishbone(1, 2.3, 0.35, true);
    },
  },

  // ---- Rear Lower Wishbone Left -----------------------------
  {
    id: 'rearLowerWishboneLeft',
    name: 'Rear Lower Wishbone (Left)',
    group: GROUP,
    description: 'Left rear lower A-arm — primary load-bearing suspension link at the rear-left corner.',
    assembledPosition: [-0.7, 0.15, 2.3],
    assembledRotation: [0, 0, 0],
    explosionDirection: [-0.8, -0.4, 0.3],
    build() {
      return buildWishbone(-1, 2.3, 0.15, false);
    },
  },

  // ---- Rear Lower Wishbone Right ----------------------------
  {
    id: 'rearLowerWishboneRight',
    name: 'Rear Lower Wishbone (Right)',
    group: GROUP,
    description: 'Right rear lower A-arm — primary load-bearing suspension link at the rear-right corner.',
    assembledPosition: [0.7, 0.15, 2.3],
    assembledRotation: [0, 0, 0],
    explosionDirection: [0.8, -0.4, 0.3],
    build() {
      return buildWishbone(1, 2.3, 0.15, false);
    },
  },

  // ---- Front Pushrod Left -----------------------------------
  {
    id: 'frontPushrodLeft',
    name: 'Front Pushrod (Left)',
    group: GROUP,
    description: 'Left front pushrod connecting the lower wishbone to the inboard torsion bar and damper.',
    assembledPosition: [-0.5, 0.3, -2.0],
    assembledRotation: [0, 0, 0],
    explosionDirection: [-0.5, 0.7, -0.3],
    build() {
      return buildRod(-1, -2.0, true);
    },
  },

  // ---- Front Pushrod Right ----------------------------------
  {
    id: 'frontPushrodRight',
    name: 'Front Pushrod (Right)',
    group: GROUP,
    description: 'Right front pushrod connecting the lower wishbone to the inboard torsion bar and damper.',
    assembledPosition: [0.5, 0.3, -2.0],
    assembledRotation: [0, 0, 0],
    explosionDirection: [0.5, 0.7, -0.3],
    build() {
      return buildRod(1, -2.0, true);
    },
  },

  // ---- Rear Pullrod Left ------------------------------------
  {
    id: 'rearPullrodLeft',
    name: 'Rear Pullrod (Left)',
    group: GROUP,
    description: 'Left rear pullrod — lower-mounted linkage for compact rear suspension packaging.',
    assembledPosition: [-0.5, 0.25, 2.3],
    assembledRotation: [0, 0, 0],
    explosionDirection: [-0.5, -0.5, 0.5],
    build() {
      return buildRod(-1, 2.3, false);
    },
  },

  // ---- Rear Pullrod Right -----------------------------------
  {
    id: 'rearPullrodRight',
    name: 'Rear Pullrod (Right)',
    group: GROUP,
    description: 'Right rear pullrod — lower-mounted linkage for compact rear suspension packaging.',
    assembledPosition: [0.5, 0.25, 2.3],
    assembledRotation: [0, 0, 0],
    explosionDirection: [0.5, -0.5, 0.5],
    build() {
      return buildRod(1, 2.3, false);
    },
  },
];
