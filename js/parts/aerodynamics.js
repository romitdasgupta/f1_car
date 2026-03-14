// ============================================================
//  Aerodynamic parts — wings, endplates, sidepods, beam wing
//  Color: #2A9D8F (teal)
// ============================================================

import * as THREE from 'three';
import { createAirfoilShape } from '../geometry/shapes.js';
import { addEdgeLines } from '../geometry/factories.js';

const GROUP = 'aerodynamics';
const COLOR = '#2A9D8F';

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
 * Helper: builds an extruded wing element from an airfoil shape.
 * @param {number} chord     — airfoil chord length
 * @param {number} span      — extrude width (wing span)
 * @param {number} thickness — airfoil thickness ratio
 * @param {number} camber    — airfoil camber ratio
 */
function buildWingElement(chord, span, thickness = 0.12, camber = 0.04) {
  const shape = createAirfoilShape(chord, thickness, camber);
  const extrudeSettings = {
    depth: span,
    bevelEnabled: false,
  };
  const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  geo.center();
  return geo;
}

export const aerodynamicsParts = [
  // ---- Front Wing Main Plane --------------------------------
  {
    id: 'frontWingMainPlane',
    name: 'Front Wing Main Plane',
    group: GROUP,
    description: 'Primary front wing element spanning the full car width — generates front downforce.',
    assembledPosition: [0, 0.1, -2.6],
    assembledRotation: [0, -Math.PI / 2, 0],
    explosionDirection: [0, -0.3, -1],
    build({ addEdgeLines }) {
      const geo = buildWingElement(0.25, 1.8, 0.12, 0.06);
      const mesh = new THREE.Mesh(geo, mat());
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      addEdgeLines(mesh);
      return mesh;
    },
  },

  // ---- Front Wing Flap Left --------------------------------
  {
    id: 'frontWingFlapLeft',
    name: 'Front Wing Flap (Left)',
    group: GROUP,
    description: 'Left outboard front wing flap — adjustable element for fine-tuning front-end balance.',
    assembledPosition: [-0.6, 0.18, -2.5],
    assembledRotation: [0, -Math.PI / 2, -0.15],
    explosionDirection: [-0.7, 0.3, -0.6],
    build({ addEdgeLines }) {
      const geo = buildWingElement(0.15, 0.5, 0.1, 0.05);
      const mesh = new THREE.Mesh(geo, mat());
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      addEdgeLines(mesh);
      return mesh;
    },
  },

  // ---- Front Wing Flap Right --------------------------------
  {
    id: 'frontWingFlapRight',
    name: 'Front Wing Flap (Right)',
    group: GROUP,
    description: 'Right outboard front wing flap — adjustable element for fine-tuning front-end balance.',
    assembledPosition: [0.6, 0.18, -2.5],
    assembledRotation: [0, -Math.PI / 2, 0.15],
    explosionDirection: [0.7, 0.3, -0.6],
    build({ addEdgeLines }) {
      const geo = buildWingElement(0.15, 0.5, 0.1, 0.05);
      const mesh = new THREE.Mesh(geo, mat());
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      addEdgeLines(mesh);
      return mesh;
    },
  },

  // ---- Front Wing Endplate Left -----------------------------
  {
    id: 'frontWingEndplateLeft',
    name: 'Front Wing Endplate (Left)',
    group: GROUP,
    description: 'Left front wing endplate — prevents pressure leakage and manages vortex generation.',
    assembledPosition: [-0.9, 0.15, -2.5],
    assembledRotation: [0, 0, 0],
    explosionDirection: [-1, 0, -0.3],
    build({ addEdgeLines }) {
      const shape = new THREE.Shape();
      shape.moveTo(0, 0);
      shape.lineTo(0.3, 0);
      shape.lineTo(0.25, 0.15);
      shape.lineTo(0.05, 0.18);
      shape.lineTo(0, 0.12);
      shape.closePath();

      const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.01, bevelEnabled: false });
      geo.center();
      const mesh = new THREE.Mesh(geo, mat());
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      addEdgeLines(mesh);
      return mesh;
    },
  },

  // ---- Front Wing Endplate Right ----------------------------
  {
    id: 'frontWingEndplateRight',
    name: 'Front Wing Endplate (Right)',
    group: GROUP,
    description: 'Right front wing endplate — prevents pressure leakage and manages vortex generation.',
    assembledPosition: [0.9, 0.15, -2.5],
    assembledRotation: [0, Math.PI, 0],
    explosionDirection: [1, 0, -0.3],
    build({ addEdgeLines }) {
      const shape = new THREE.Shape();
      shape.moveTo(0, 0);
      shape.lineTo(0.3, 0);
      shape.lineTo(0.25, 0.15);
      shape.lineTo(0.05, 0.18);
      shape.lineTo(0, 0.12);
      shape.closePath();

      const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.01, bevelEnabled: false });
      geo.center();
      const mesh = new THREE.Mesh(geo, mat());
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      addEdgeLines(mesh);
      return mesh;
    },
  },

  // ---- Rear Wing Main Plane --------------------------------
  {
    id: 'rearWingMainPlane',
    name: 'Rear Wing Main Plane',
    group: GROUP,
    description: 'Primary rear wing element — the largest single source of rear downforce on the car.',
    assembledPosition: [0, 0.8, 2.4],
    assembledRotation: [0, -Math.PI / 2, 0],
    explosionDirection: [0, 0.5, 1],
    build({ addEdgeLines }) {
      const geo = buildWingElement(0.2, 0.75, 0.14, 0.06);
      const mesh = new THREE.Mesh(geo, mat());
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      addEdgeLines(mesh);
      return mesh;
    },
  },

  // ---- Rear Wing DRS Flap ----------------------------------
  {
    id: 'rearWingDRSFlap',
    name: 'Rear Wing DRS Flap',
    group: GROUP,
    description: 'Drag Reduction System flap — opens to reduce drag on straights for overtaking.',
    assembledPosition: [0, 0.9, 2.35],
    assembledRotation: [0, -Math.PI / 2, 0],
    explosionDirection: [0, 1, 0.5],
    build({ addEdgeLines }) {
      const geo = buildWingElement(0.1, 0.7, 0.1, 0.03);
      const mesh = new THREE.Mesh(geo, mat());
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      addEdgeLines(mesh);
      return mesh;
    },
  },

  // ---- Rear Wing Endplate Left ------------------------------
  {
    id: 'rearWingEndplateLeft',
    name: 'Rear Wing Endplate (Left)',
    group: GROUP,
    description: 'Left rear wing endplate — seals wing tip and incorporates rear light.',
    assembledPosition: [-0.4, 0.8, 2.4],
    assembledRotation: [0, 0, 0],
    explosionDirection: [-1, 0.3, 0.3],
    build({ addEdgeLines }) {
      const shape = new THREE.Shape();
      shape.moveTo(0, 0);
      shape.lineTo(0.25, 0);
      shape.lineTo(0.25, 0.22);
      shape.quadraticCurveTo(0.2, 0.28, 0.1, 0.28);
      shape.lineTo(0, 0.2);
      shape.closePath();

      const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.012, bevelEnabled: false });
      geo.center();
      const mesh = new THREE.Mesh(geo, mat());
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      addEdgeLines(mesh);
      return mesh;
    },
  },

  // ---- Rear Wing Endplate Right -----------------------------
  {
    id: 'rearWingEndplateRight',
    name: 'Rear Wing Endplate (Right)',
    group: GROUP,
    description: 'Right rear wing endplate — seals wing tip and incorporates rear light.',
    assembledPosition: [0.4, 0.8, 2.4],
    assembledRotation: [0, Math.PI, 0],
    explosionDirection: [1, 0.3, 0.3],
    build({ addEdgeLines }) {
      const shape = new THREE.Shape();
      shape.moveTo(0, 0);
      shape.lineTo(0.25, 0);
      shape.lineTo(0.25, 0.22);
      shape.quadraticCurveTo(0.2, 0.28, 0.1, 0.28);
      shape.lineTo(0, 0.2);
      shape.closePath();

      const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.012, bevelEnabled: false });
      geo.center();
      const mesh = new THREE.Mesh(geo, mat());
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      addEdgeLines(mesh);
      return mesh;
    },
  },

  // ---- Sidepod Left -----------------------------------------
  {
    id: 'sidepodLeft',
    name: 'Sidepod (Left)',
    group: GROUP,
    description: 'Left sidepod body panel — channels cooling air to the radiator and houses internal components.',
    assembledPosition: [-0.6, 0.35, 0.8],
    assembledRotation: [0, 0, 0],
    explosionDirection: [-1, 0.2, 0],
    build({ addEdgeLines }) {
      const shape = new THREE.Shape();
      // Side profile — inlet scoop leading into tapered body
      shape.moveTo(0, 0);
      shape.lineTo(0.08, 0);
      shape.lineTo(0.08, -0.7);
      shape.quadraticCurveTo(0.06, -0.9, 0, -0.9);
      shape.lineTo(-0.02, -0.9);
      shape.quadraticCurveTo(-0.05, -0.7, -0.05, -0.3);
      shape.lineTo(-0.05, 0);
      shape.closePath();

      const extrudeSettings = { depth: 0.22, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01, bevelSegments: 2 };
      const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      geo.rotateX(-Math.PI / 2);
      geo.center();
      const mesh = new THREE.Mesh(geo, mat());
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      addEdgeLines(mesh);
      return mesh;
    },
  },

  // ---- Sidepod Right ----------------------------------------
  {
    id: 'sidepodRight',
    name: 'Sidepod (Right)',
    group: GROUP,
    description: 'Right sidepod body panel — channels cooling air to the radiator and houses internal components.',
    assembledPosition: [0.6, 0.35, 0.8],
    assembledRotation: [0, Math.PI, 0],
    explosionDirection: [1, 0.2, 0],
    build({ addEdgeLines }) {
      const shape = new THREE.Shape();
      shape.moveTo(0, 0);
      shape.lineTo(0.08, 0);
      shape.lineTo(0.08, -0.7);
      shape.quadraticCurveTo(0.06, -0.9, 0, -0.9);
      shape.lineTo(-0.02, -0.9);
      shape.quadraticCurveTo(-0.05, -0.7, -0.05, -0.3);
      shape.lineTo(-0.05, 0);
      shape.closePath();

      const extrudeSettings = { depth: 0.22, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01, bevelSegments: 2 };
      const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      geo.rotateX(-Math.PI / 2);
      geo.center();
      const mesh = new THREE.Mesh(geo, mat());
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      addEdgeLines(mesh);
      return mesh;
    },
  },

  // ---- Beam Wing --------------------------------------------
  {
    id: 'beamWing',
    name: 'Beam Wing',
    group: GROUP,
    description: 'Small lower rear wing element that works with the diffuser to enhance rear downforce.',
    assembledPosition: [0, 0.6, 2.5],
    assembledRotation: [0, -Math.PI / 2, 0],
    explosionDirection: [0, -0.3, 1],
    build({ addEdgeLines }) {
      const geo = buildWingElement(0.1, 0.55, 0.1, 0.04);
      const mesh = new THREE.Mesh(geo, mat());
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      addEdgeLines(mesh);
      return mesh;
    },
  },
];
