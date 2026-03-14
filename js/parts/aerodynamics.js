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
    assembledPosition: [0, 0.05, -2.55],
    assembledRotation: [0, -Math.PI / 2, 0],
    explosionDirection: [0, -0.3, -1],
    build({ addEdgeLines }) {
      // Wide main plane spanning nearly full track width
      const geo = buildWingElement(0.22, 1.7, 0.12, 0.06);
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
    assembledPosition: [-0.45, 0.12, -2.48],
    assembledRotation: [0, -Math.PI / 2, -0.12],
    explosionDirection: [-0.7, 0.3, -0.6],
    build({ addEdgeLines }) {
      const geo = buildWingElement(0.14, 0.7, 0.1, 0.05);
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
    assembledPosition: [0.45, 0.12, -2.48],
    assembledRotation: [0, -Math.PI / 2, 0.12],
    explosionDirection: [0.7, 0.3, -0.6],
    build({ addEdgeLines }) {
      const geo = buildWingElement(0.14, 0.7, 0.1, 0.05);
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
    assembledPosition: [-0.87, 0.1, -2.5],
    assembledRotation: [0, 0, 0],
    explosionDirection: [-1, 0, -0.3],
    build({ addEdgeLines }) {
      // Tall vertical plate at wing tip
      const shape = new THREE.Shape();
      shape.moveTo(0, 0);
      shape.lineTo(0.3, 0);
      shape.lineTo(0.25, 0.2);
      shape.lineTo(0.05, 0.25);
      shape.lineTo(0, 0.18);
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

  // ---- Front Wing Endplate Right ----------------------------
  {
    id: 'frontWingEndplateRight',
    name: 'Front Wing Endplate (Right)',
    group: GROUP,
    description: 'Right front wing endplate — prevents pressure leakage and manages vortex generation.',
    assembledPosition: [0.87, 0.1, -2.5],
    assembledRotation: [0, Math.PI, 0],
    explosionDirection: [1, 0, -0.3],
    build({ addEdgeLines }) {
      const shape = new THREE.Shape();
      shape.moveTo(0, 0);
      shape.lineTo(0.3, 0);
      shape.lineTo(0.25, 0.2);
      shape.lineTo(0.05, 0.25);
      shape.lineTo(0, 0.18);
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

  // ---- Rear Wing Main Plane --------------------------------
  {
    id: 'rearWingMainPlane',
    name: 'Rear Wing Main Plane',
    group: GROUP,
    description: 'Primary rear wing element — the largest single source of rear downforce on the car.',
    assembledPosition: [0, 0.65, 2.45],
    assembledRotation: [0, -Math.PI / 2, 0],
    explosionDirection: [0, 0.5, 1],
    build({ addEdgeLines }) {
      // Wider rear wing
      const geo = buildWingElement(0.2, 0.85, 0.14, 0.06);
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
    assembledPosition: [0, 0.76, 2.4],
    assembledRotation: [0, -Math.PI / 2, 0],
    explosionDirection: [0, 1, 0.5],
    build({ addEdgeLines }) {
      const geo = buildWingElement(0.1, 0.8, 0.1, 0.03);
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
    assembledPosition: [-0.44, 0.6, 2.45],
    assembledRotation: [0, 0, 0],
    explosionDirection: [-1, 0.3, 0.3],
    build({ addEdgeLines }) {
      // Tall endplate
      const shape = new THREE.Shape();
      shape.moveTo(0, 0);
      shape.lineTo(0.28, 0);
      shape.lineTo(0.28, 0.3);
      shape.quadraticCurveTo(0.22, 0.38, 0.1, 0.38);
      shape.lineTo(0, 0.28);
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
    assembledPosition: [0.44, 0.6, 2.45],
    assembledRotation: [0, Math.PI, 0],
    explosionDirection: [1, 0.3, 0.3],
    build({ addEdgeLines }) {
      const shape = new THREE.Shape();
      shape.moveTo(0, 0);
      shape.lineTo(0.28, 0);
      shape.lineTo(0.28, 0.3);
      shape.quadraticCurveTo(0.22, 0.38, 0.1, 0.38);
      shape.lineTo(0, 0.28);
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
    assembledPosition: [-0.45, 0.2, 0.6],
    assembledRotation: [0, 0, 0],
    explosionDirection: [-1, 0.2, 0],
    build({ addEdgeLines }) {
      const group = new THREE.Group();

      // Main sidepod body — sculpted inlet shape
      // Side profile as shape, extruded sideways
      const shape = new THREE.Shape();
      // Inlet opening at front, tapering to narrow undercut at rear
      shape.moveTo(0, 0.04);        // front bottom
      shape.lineTo(0, 0.28);        // front top (inlet opening top)
      shape.quadraticCurveTo(0.05, 0.3, 0.15, 0.28); // inlet curve
      shape.lineTo(0.8, 0.22);      // top line tapering rearward
      shape.quadraticCurveTo(1.2, 0.18, 1.5, 0.12);  // rear taper
      shape.lineTo(1.5, 0.04);      // rear bottom
      shape.quadraticCurveTo(1.2, 0.01, 0.8, 0.01);  // undercut
      shape.lineTo(0.3, 0.02);
      shape.lineTo(0, 0.04);

      const extrudeSettings = {
        depth: 0.28,
        bevelEnabled: true,
        bevelThickness: 0.01,
        bevelSize: 0.01,
        bevelSegments: 2,
      };
      const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      geo.center();
      // Rotate so extrude direction is along X (sideways)
      const mesh = new THREE.Mesh(geo, mat());
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      addEdgeLines(mesh);
      group.add(mesh);

      return group;
    },
  },

  // ---- Sidepod Right ----------------------------------------
  {
    id: 'sidepodRight',
    name: 'Sidepod (Right)',
    group: GROUP,
    description: 'Right sidepod body panel — channels cooling air to the radiator and houses internal components.',
    assembledPosition: [0.45, 0.2, 0.6],
    assembledRotation: [0, Math.PI, 0],
    explosionDirection: [1, 0.2, 0],
    build({ addEdgeLines }) {
      const group = new THREE.Group();

      // Mirror of left sidepod
      const shape = new THREE.Shape();
      shape.moveTo(0, 0.04);
      shape.lineTo(0, 0.28);
      shape.quadraticCurveTo(0.05, 0.3, 0.15, 0.28);
      shape.lineTo(0.8, 0.22);
      shape.quadraticCurveTo(1.2, 0.18, 1.5, 0.12);
      shape.lineTo(1.5, 0.04);
      shape.quadraticCurveTo(1.2, 0.01, 0.8, 0.01);
      shape.lineTo(0.3, 0.02);
      shape.lineTo(0, 0.04);

      const extrudeSettings = {
        depth: 0.28,
        bevelEnabled: true,
        bevelThickness: 0.01,
        bevelSize: 0.01,
        bevelSegments: 2,
      };
      const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      geo.center();
      const mesh = new THREE.Mesh(geo, mat());
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      addEdgeLines(mesh);
      group.add(mesh);

      return group;
    },
  },

  // ---- Beam Wing --------------------------------------------
  {
    id: 'beamWing',
    name: 'Beam Wing',
    group: GROUP,
    description: 'Small lower rear wing element that works with the diffuser to enhance rear downforce.',
    assembledPosition: [0, 0.42, 2.5],
    assembledRotation: [0, -Math.PI / 2, 0],
    explosionDirection: [0, -0.3, 1],
    build({ addEdgeLines }) {
      const geo = buildWingElement(0.08, 0.6, 0.1, 0.04);
      const mesh = new THREE.Mesh(geo, mat());
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      addEdgeLines(mesh);
      return mesh;
    },
  },
];
