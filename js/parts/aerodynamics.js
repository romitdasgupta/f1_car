// ============================================================
//  Aerodynamic parts — wings, endplates, sidepods, beam wing
//  Color: #2A9D8F (teal)
//  SOLID, THICK geometry — chunky and dramatic
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
    opacity: 0.96,
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
    bevelEnabled: true,
    bevelThickness: 0.004,
    bevelSize: 0.004,
    bevelSegments: 2,
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
    assembledPosition: [0, 0.04, -2.55],
    assembledRotation: [0, -Math.PI / 2, 0],
    explosionDirection: [0, -0.3, -1],
    build({ addEdgeLines }) {
      const group = new THREE.Group();

      // WIDE main plane — 1.85 span, thick airfoil
      const geo = buildWingElement(0.28, 1.85, 0.15, 0.07);
      const mesh = new THREE.Mesh(geo, mat());
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      addEdgeLines(mesh);
      group.add(mesh);

      // Nose-wing pylons connecting wing to nose tip area
      const pylonH = 0.10;
      const pylonGeoL = new THREE.BoxGeometry(0.03, pylonH, 0.12);
      const pylonL = new THREE.Mesh(pylonGeoL, mat({ opacity: 0.94 }));
      pylonL.position.set(-0.08, pylonH / 2 + 0.01, 0);
      pylonL.castShadow = true;
      group.add(pylonL);

      const pylonGeoR = new THREE.BoxGeometry(0.03, pylonH, 0.12);
      const pylonR = new THREE.Mesh(pylonGeoR, mat({ opacity: 0.94 }));
      pylonR.position.set(0.08, pylonH / 2 + 0.01, 0);
      pylonR.castShadow = true;
      group.add(pylonR);

      return group;
    },
  },

  // ---- Front Wing Flap Left --------------------------------
  {
    id: 'frontWingFlapLeft',
    name: 'Front Wing Flap (Left)',
    group: GROUP,
    description: 'Left outboard front wing flap — adjustable element for fine-tuning front-end balance.',
    assembledPosition: [-0.48, 0.11, -2.50],
    assembledRotation: [0, -Math.PI / 2, -0.12],
    explosionDirection: [-0.7, 0.3, -0.6],
    build({ addEdgeLines }) {
      const group = new THREE.Group();

      // Thicker flap — more chord, more visual weight
      const geo = buildWingElement(0.18, 0.75, 0.13, 0.06);
      const mesh = new THREE.Mesh(geo, mat());
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      addEdgeLines(mesh);
      group.add(mesh);

      // Second flap element stacked above
      const geo2 = buildWingElement(0.12, 0.70, 0.11, 0.05);
      const mesh2 = new THREE.Mesh(geo2, mat({ opacity: 0.93 }));
      mesh2.position.set(0, 0.04, -0.02);
      mesh2.castShadow = true;
      mesh2.receiveShadow = true;
      addEdgeLines(mesh2);
      group.add(mesh2);

      return group;
    },
  },

  // ---- Front Wing Flap Right --------------------------------
  {
    id: 'frontWingFlapRight',
    name: 'Front Wing Flap (Right)',
    group: GROUP,
    description: 'Right outboard front wing flap — adjustable element for fine-tuning front-end balance.',
    assembledPosition: [0.48, 0.11, -2.50],
    assembledRotation: [0, -Math.PI / 2, 0.12],
    explosionDirection: [0.7, 0.3, -0.6],
    build({ addEdgeLines }) {
      const group = new THREE.Group();

      // Mirror of left — thicker flaps
      const geo = buildWingElement(0.18, 0.75, 0.13, 0.06);
      const mesh = new THREE.Mesh(geo, mat());
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      addEdgeLines(mesh);
      group.add(mesh);

      // Second flap element
      const geo2 = buildWingElement(0.12, 0.70, 0.11, 0.05);
      const mesh2 = new THREE.Mesh(geo2, mat({ opacity: 0.93 }));
      mesh2.position.set(0, 0.04, -0.02);
      mesh2.castShadow = true;
      mesh2.receiveShadow = true;
      addEdgeLines(mesh2);
      group.add(mesh2);

      return group;
    },
  },

  // ---- Front Wing Endplate Left -----------------------------
  {
    id: 'frontWingEndplateLeft',
    name: 'Front Wing Endplate (Left)',
    group: GROUP,
    description: 'Left front wing endplate — prevents pressure leakage and manages vortex generation.',
    assembledPosition: [-0.92, 0.08, -2.52],
    assembledRotation: [0, 0, 0],
    explosionDirection: [-1, 0, -0.3],
    build({ addEdgeLines }) {
      // TALL, SOLID vertical walls — 0.30 height, thick
      const shape = new THREE.Shape();
      shape.moveTo(0, 0);
      shape.lineTo(0.38, 0);
      shape.lineTo(0.34, 0.08);
      shape.lineTo(0.32, 0.26);
      shape.quadraticCurveTo(0.28, 0.32, 0.18, 0.32);
      shape.lineTo(0.06, 0.30);
      shape.lineTo(0, 0.22);
      shape.closePath();

      const geo = new THREE.ExtrudeGeometry(shape, {
        depth: 0.022,
        bevelEnabled: true,
        bevelThickness: 0.003,
        bevelSize: 0.003,
        bevelSegments: 2,
      });
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
    assembledPosition: [0.92, 0.08, -2.52],
    assembledRotation: [0, Math.PI, 0],
    explosionDirection: [1, 0, -0.3],
    build({ addEdgeLines }) {
      // Mirror of left — tall and thick
      const shape = new THREE.Shape();
      shape.moveTo(0, 0);
      shape.lineTo(0.38, 0);
      shape.lineTo(0.34, 0.08);
      shape.lineTo(0.32, 0.26);
      shape.quadraticCurveTo(0.28, 0.32, 0.18, 0.32);
      shape.lineTo(0.06, 0.30);
      shape.lineTo(0, 0.22);
      shape.closePath();

      const geo = new THREE.ExtrudeGeometry(shape, {
        depth: 0.022,
        bevelEnabled: true,
        bevelThickness: 0.003,
        bevelSize: 0.003,
        bevelSegments: 2,
      });
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
    assembledPosition: [0, 0.68, 2.45],
    assembledRotation: [0, -Math.PI / 2, 0],
    explosionDirection: [0, 0.5, 1],
    build({ addEdgeLines }) {
      const group = new THREE.Group();

      // WIDER, THICKER rear wing — dramatic presence
      const geo = buildWingElement(0.26, 0.92, 0.16, 0.07);
      const mesh = new THREE.Mesh(geo, mat());
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      addEdgeLines(mesh);
      group.add(mesh);

      // Swan-neck mounts — two pylons connecting wing to body
      const mountH = 0.32;
      const mountGeoL = new THREE.BoxGeometry(0.025, mountH, 0.04);
      const mountL = new THREE.Mesh(mountGeoL, mat({ opacity: 0.94 }));
      mountL.position.set(-0.18, -mountH / 2, 0);
      mountL.castShadow = true;
      addEdgeLines(mountL);
      group.add(mountL);

      const mountGeoR = new THREE.BoxGeometry(0.025, mountH, 0.04);
      const mountR = new THREE.Mesh(mountGeoR, mat({ opacity: 0.94 }));
      mountR.position.set(0.18, -mountH / 2, 0);
      mountR.castShadow = true;
      addEdgeLines(mountR);
      group.add(mountR);

      return group;
    },
  },

  // ---- Rear Wing DRS Flap ----------------------------------
  {
    id: 'rearWingDRSFlap',
    name: 'Rear Wing DRS Flap',
    group: GROUP,
    description: 'Drag Reduction System flap — opens to reduce drag on straights for overtaking.',
    assembledPosition: [0, 0.80, 2.42],
    assembledRotation: [0, -Math.PI / 2, 0],
    explosionDirection: [0, 1, 0.5],
    build({ addEdgeLines }) {
      // Thicker DRS flap — clearly visible above main plane
      const geo = buildWingElement(0.14, 0.88, 0.12, 0.04);
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
    assembledPosition: [-0.48, 0.52, 2.45],
    assembledRotation: [0, 0, 0],
    explosionDirection: [-1, 0.3, 0.3],
    build({ addEdgeLines }) {
      const group = new THREE.Group();

      // TALL endplate — 0.50 height, solid vertical wall defining rear silhouette
      const shape = new THREE.Shape();
      shape.moveTo(0, 0);
      shape.lineTo(0.36, 0);
      shape.lineTo(0.36, 0.12);
      shape.lineTo(0.34, 0.40);
      shape.quadraticCurveTo(0.30, 0.50, 0.18, 0.50);
      shape.lineTo(0.08, 0.48);
      shape.lineTo(0, 0.42);
      shape.closePath();

      const geo = new THREE.ExtrudeGeometry(shape, {
        depth: 0.022,
        bevelEnabled: true,
        bevelThickness: 0.004,
        bevelSize: 0.004,
        bevelSegments: 2,
      });
      geo.center();
      const mesh = new THREE.Mesh(geo, mat());
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      addEdgeLines(mesh);
      group.add(mesh);

      // Rear light strip — small accent at the bottom
      const lightGeo = new THREE.BoxGeometry(0.15, 0.025, 0.018);
      const lightMesh = new THREE.Mesh(lightGeo, mat({ color: '#cc2222', emissive: '#cc2222', emissiveIntensity: 0.3, opacity: 0.98 }));
      lightMesh.position.set(0.05, -0.18, 0);
      group.add(lightMesh);

      return group;
    },
  },

  // ---- Rear Wing Endplate Right -----------------------------
  {
    id: 'rearWingEndplateRight',
    name: 'Rear Wing Endplate (Right)',
    group: GROUP,
    description: 'Right rear wing endplate — seals wing tip and incorporates rear light.',
    assembledPosition: [0.48, 0.52, 2.45],
    assembledRotation: [0, Math.PI, 0],
    explosionDirection: [1, 0.3, 0.3],
    build({ addEdgeLines }) {
      const group = new THREE.Group();

      // Mirror of left — TALL endplate
      const shape = new THREE.Shape();
      shape.moveTo(0, 0);
      shape.lineTo(0.36, 0);
      shape.lineTo(0.36, 0.12);
      shape.lineTo(0.34, 0.40);
      shape.quadraticCurveTo(0.30, 0.50, 0.18, 0.50);
      shape.lineTo(0.08, 0.48);
      shape.lineTo(0, 0.42);
      shape.closePath();

      const geo = new THREE.ExtrudeGeometry(shape, {
        depth: 0.022,
        bevelEnabled: true,
        bevelThickness: 0.004,
        bevelSize: 0.004,
        bevelSegments: 2,
      });
      geo.center();
      const mesh = new THREE.Mesh(geo, mat());
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      addEdgeLines(mesh);
      group.add(mesh);

      // Rear light strip
      const lightGeo = new THREE.BoxGeometry(0.15, 0.025, 0.018);
      const lightMesh = new THREE.Mesh(lightGeo, mat({ color: '#cc2222', emissive: '#cc2222', emissiveIntensity: 0.3, opacity: 0.98 }));
      lightMesh.position.set(0.05, -0.18, 0);
      group.add(lightMesh);

      return group;
    },
  },

  // ---- Sidepod Left -----------------------------------------
  {
    id: 'sidepodLeft',
    name: 'Sidepod (Left)',
    group: GROUP,
    description: 'Left sidepod body panel — channels cooling air to the radiator and houses internal components.',
    assembledPosition: [-0.48, 0.18, 0.3],
    assembledRotation: [0, 0, 0],
    explosionDirection: [-1, 0.2, 0],
    build({ addEdgeLines }) {
      const group = new THREE.Group();

      // === BIG SOLID SIDEPOD — chunky 3D body ===
      // Main body: thick box with shaped vertices for coke-bottle taper
      const spW = 0.36, spH = 0.36, spL = 1.6;
      const spGeo = new THREE.BoxGeometry(spW, spH, spL, 2, 2, 6);
      const spos = spGeo.attributes.position;

      for (let i = 0; i < spos.count; i++) {
        const x = spos.getX(i);
        const y = spos.getY(i);
        const z = spos.getZ(i);

        let newX = x;
        let newY = y;

        // Coke-bottle taper at the rear
        if (z > 0.2) {
          const rearFactor = 1.0 - (z - 0.2) * 0.35;
          newX = x * Math.max(rearFactor, 0.35);
          newY = y * Math.max(rearFactor, 0.5);
        }

        // Taper at the front for inlet shape
        if (z < -0.5) {
          const frontFactor = 1.0 - (-0.5 - z) * 0.2;
          newX = x * Math.max(frontFactor, 0.7);
        }

        // Round the top edges
        if (y > 0.1) {
          const topRound = 1.0 - Math.pow((y - 0.1) / (spH / 2 - 0.1), 2) * 0.15;
          newX *= topRound;
        }

        spos.setX(i, newX);
        spos.setY(i, newY);
      }
      spos.needsUpdate = true;
      spGeo.computeVertexNormals();

      const spBody = new THREE.Mesh(spGeo, mat());
      spBody.castShadow = true;
      spBody.receiveShadow = true;
      addEdgeLines(spBody);
      group.add(spBody);

      // Inlet opening — dark recessed area at front face
      const inletGeo = new THREE.BoxGeometry(spW * 0.7, spH * 0.65, 0.06);
      const inletMesh = new THREE.Mesh(inletGeo, mat({
        color: '#1a1a1a',
        opacity: 0.95,
        metalness: 0.05,
        roughness: 0.8,
      }));
      inletMesh.position.set(0, 0.02, -spL / 2 - 0.01);
      group.add(inletMesh);

      // Top fairing — smooth continuation to body
      const fairGeo = new THREE.BoxGeometry(spW * 0.6, 0.04, spL * 0.5);
      const fair = new THREE.Mesh(fairGeo, mat({ opacity: 0.93 }));
      fair.position.set(0, spH / 2 + 0.01, -0.15);
      fair.castShadow = true;
      group.add(fair);

      return group;
    },
  },

  // ---- Sidepod Right ----------------------------------------
  {
    id: 'sidepodRight',
    name: 'Sidepod (Right)',
    group: GROUP,
    description: 'Right sidepod body panel — channels cooling air to the radiator and houses internal components.',
    assembledPosition: [0.48, 0.18, 0.3],
    assembledRotation: [0, Math.PI, 0],
    explosionDirection: [1, 0.2, 0],
    build({ addEdgeLines }) {
      const group = new THREE.Group();

      // === Mirror of left sidepod — big chunky body ===
      const spW = 0.36, spH = 0.36, spL = 1.6;
      const spGeo = new THREE.BoxGeometry(spW, spH, spL, 2, 2, 6);
      const spos = spGeo.attributes.position;

      for (let i = 0; i < spos.count; i++) {
        const x = spos.getX(i);
        const y = spos.getY(i);
        const z = spos.getZ(i);

        let newX = x;
        let newY = y;

        // Coke-bottle taper at rear
        if (z > 0.2) {
          const rearFactor = 1.0 - (z - 0.2) * 0.35;
          newX = x * Math.max(rearFactor, 0.35);
          newY = y * Math.max(rearFactor, 0.5);
        }

        // Taper at front
        if (z < -0.5) {
          const frontFactor = 1.0 - (-0.5 - z) * 0.2;
          newX = x * Math.max(frontFactor, 0.7);
        }

        // Round top edges
        if (y > 0.1) {
          const topRound = 1.0 - Math.pow((y - 0.1) / (spH / 2 - 0.1), 2) * 0.15;
          newX *= topRound;
        }

        spos.setX(i, newX);
        spos.setY(i, newY);
      }
      spos.needsUpdate = true;
      spGeo.computeVertexNormals();

      const spBody = new THREE.Mesh(spGeo, mat());
      spBody.castShadow = true;
      spBody.receiveShadow = true;
      addEdgeLines(spBody);
      group.add(spBody);

      // Inlet opening
      const inletGeo = new THREE.BoxGeometry(spW * 0.7, spH * 0.65, 0.06);
      const inletMesh = new THREE.Mesh(inletGeo, mat({
        color: '#1a1a1a',
        opacity: 0.95,
        metalness: 0.05,
        roughness: 0.8,
      }));
      inletMesh.position.set(0, 0.02, -spL / 2 - 0.01);
      group.add(inletMesh);

      // Top fairing
      const fairGeo = new THREE.BoxGeometry(spW * 0.6, 0.04, spL * 0.5);
      const fair = new THREE.Mesh(fairGeo, mat({ opacity: 0.93 }));
      fair.position.set(0, spH / 2 + 0.01, -0.15);
      fair.castShadow = true;
      group.add(fair);

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
      const group = new THREE.Group();

      // Thicker beam wing
      const geo = buildWingElement(0.12, 0.68, 0.12, 0.05);
      const mesh = new THREE.Mesh(geo, mat());
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      addEdgeLines(mesh);
      group.add(mesh);

      // Mounting pylons to the crash structure
      const pylonGeoL = new THREE.BoxGeometry(0.02, 0.08, 0.03);
      const pylonL = new THREE.Mesh(pylonGeoL, mat({ opacity: 0.93 }));
      pylonL.position.set(-0.15, -0.05, 0);
      pylonL.castShadow = true;
      group.add(pylonL);

      const pylonGeoR = new THREE.BoxGeometry(0.02, 0.08, 0.03);
      const pylonR = new THREE.Mesh(pylonGeoR, mat({ opacity: 0.93 }));
      pylonR.position.set(0.15, -0.05, 0);
      pylonR.castShadow = true;
      group.add(pylonR);

      return group;
    },
  },
];
