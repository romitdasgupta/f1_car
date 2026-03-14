// ============================================================
//  Aerodynamic parts — wings, endplates, sidepods, beam wing
//  Color: #2A9D8F (teal)
//  HIGH-POLY vertex-deformed geometry for sculpted F1 shapes
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

function smoothstep(edge0, edge1, x) {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

/**
 * Helper: builds an extruded wing element from an airfoil shape.
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

/**
 * Build a sculpted sidepod with dramatic undercut/coke-bottle shape.
 * Returns a THREE.Group.
 */
function buildSidepod({ addEdgeLines }) {
  const group = new THREE.Group();

  const spW = 0.32, spH = 0.34, spL = 1.6;
  const spGeo = new THREE.BoxGeometry(spW, spH, spL, 6, 6, 16);
  const spos = spGeo.attributes.position;
  const halfW = spW / 2;
  const halfH = spH / 2;
  const halfL = spL / 2;

  for (let i = 0; i < spos.count; i++) {
    let x = spos.getX(i);
    let y = spos.getY(i);
    let z = spos.getZ(i);

    const xNorm = x / halfW;
    const yNorm = y / halfH;
    const zNorm = z / halfL; // -1 (front) to +1 (rear)

    // --- Inlet scoop at front face ---
    // Push upper-front vertices inward to create a concave scoop
    if (zNorm < -0.6) {
      const frontT = smoothstep(-0.6, -1.0, zNorm);
      // Upper part scoops inward more
      if (yNorm > 0.0) {
        const scoopDepth = frontT * yNorm * 0.10;
        x *= (1.0 - scoopDepth * 2.0);
      }
      // Slightly narrow the front overall
      const frontNarrow = lerp(1.0, 0.82, frontT);
      x *= frontNarrow;
    }

    // --- Dramatic undercut / coke-bottle taper ---
    // The lower half tapers inward dramatically from z=0 rearward
    if (zNorm > -0.1) {
      const rearT = smoothstep(-0.1, 1.0, zNorm); // 0..1 from z~0 to rear

      // Top stays wider, bottom narrows dramatically
      // At max rear (zNorm=1): bottom is ~0.10 wide, top is still ~0.18
      if (yNorm < 0) {
        // Lower half: aggressive undercut
        const undercut = lerp(1.0, 0.20, Math.pow(rearT, 0.9));
        x *= undercut;
        // Also pull lower vertices up to create the concave undercut shape
        const liftAmount = rearT * Math.abs(yNorm) * 0.08;
        y += liftAmount;
      } else {
        // Upper half: moderate taper (follows engine cover shape)
        const topTaper = lerp(1.0, 0.40, Math.pow(rearT, 1.1));
        x *= topTaper;
      }

      // Overall rear narrowing
      const overallRearTaper = lerp(1.0, 0.55, rearT);
      x *= overallRearTaper;

      // Height reduces toward rear
      y *= lerp(1.0, 0.70, rearT * 0.5);
    }

    // --- Smooth top surface flow ---
    if (yNorm > 0.6) {
      // Dome the top gently
      const topT = (yNorm - 0.6) / 0.4;
      const domeInset = topT * 0.05;
      x *= (1.0 - domeInset);
      // Slight dome rise
      y += (1.0 - Math.abs(xNorm)) * 0.008;
    }

    // --- Round all corners using sin/cos ---
    const absXn = Math.abs(xNorm);
    const absYn = Math.abs(yNorm);
    const cornerR = 0.25;
    if (absXn > (1.0 - cornerR) && absYn > (1.0 - cornerR)) {
      const cx = 1.0 - cornerR;
      const cy = 1.0 - cornerR;
      const dx = absXn - cx;
      const dy = absYn - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > cornerR) {
        const s = cornerR / dist;
        const correctedX = (cx + dx * s) / absXn;
        const correctedY = (cy + dy * s) / absYn;
        x *= Math.min(correctedX, 1.0);
        y *= Math.min(correctedY, 1.0);
      }
    }

    spos.setX(i, x);
    spos.setY(i, y);
    spos.setZ(i, z);
  }
  spos.needsUpdate = true;
  spGeo.computeVertexNormals();

  const spBody = new THREE.Mesh(spGeo, mat());
  spBody.castShadow = true;
  spBody.receiveShadow = true;
  addEdgeLines(spBody);
  group.add(spBody);

  // Dark inlet mesh at the front face
  const inletShape = new THREE.Shape();
  // Rounded rectangle inlet
  const iw = spW * 0.55, ih = spH * 0.55;
  const ir = 0.02;
  inletShape.moveTo(-iw / 2 + ir, -ih / 2);
  inletShape.lineTo(iw / 2 - ir, -ih / 2);
  inletShape.quadraticCurveTo(iw / 2, -ih / 2, iw / 2, -ih / 2 + ir);
  inletShape.lineTo(iw / 2, ih / 2 - ir);
  inletShape.quadraticCurveTo(iw / 2, ih / 2, iw / 2 - ir, ih / 2);
  inletShape.lineTo(-iw / 2 + ir, ih / 2);
  inletShape.quadraticCurveTo(-iw / 2, ih / 2, -iw / 2, ih / 2 - ir);
  inletShape.lineTo(-iw / 2, -ih / 2 + ir);
  inletShape.quadraticCurveTo(-iw / 2, -ih / 2, -iw / 2 + ir, -ih / 2);

  const inletGeo = new THREE.ExtrudeGeometry(inletShape, {
    depth: 0.05,
    bevelEnabled: false,
  });
  inletGeo.center();
  const inletMesh = new THREE.Mesh(inletGeo, mat({
    color: '#1a1a1a',
    opacity: 0.95,
    metalness: 0.05,
    roughness: 0.8,
  }));
  inletMesh.position.set(0, 0.02, -spL / 2 - 0.01);
  inletMesh.rotation.x = 0;
  group.add(inletMesh);

  return group;
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

      // Wide main plane — 1.85 span, thick airfoil
      const geo = buildWingElement(0.28, 1.85, 0.15, 0.07);
      const mesh = new THREE.Mesh(geo, mat());
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      addEdgeLines(mesh);
      group.add(mesh);

      // Nose-wing pylons
      const pylonH = 0.10;
      const pylonGeoL = new THREE.BoxGeometry(0.025, pylonH, 0.10);
      const pylonL = new THREE.Mesh(pylonGeoL, mat({ opacity: 0.94 }));
      pylonL.position.set(-0.06, pylonH / 2 + 0.01, 0);
      pylonL.castShadow = true;
      group.add(pylonL);

      const pylonGeoR = new THREE.BoxGeometry(0.025, pylonH, 0.10);
      const pylonR = new THREE.Mesh(pylonGeoR, mat({ opacity: 0.94 }));
      pylonR.position.set(0.06, pylonH / 2 + 0.01, 0);
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

      const geo = buildWingElement(0.18, 0.75, 0.13, 0.06);
      const mesh = new THREE.Mesh(geo, mat());
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      addEdgeLines(mesh);
      group.add(mesh);

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
      // Modern curved endplate shape
      const shape = new THREE.Shape();
      shape.moveTo(0, 0);
      shape.lineTo(0.38, 0);
      shape.quadraticCurveTo(0.36, 0.05, 0.34, 0.10);
      shape.lineTo(0.32, 0.24);
      shape.quadraticCurveTo(0.28, 0.32, 0.18, 0.33);
      shape.quadraticCurveTo(0.10, 0.33, 0.06, 0.30);
      shape.quadraticCurveTo(0.02, 0.26, 0, 0.20);
      shape.closePath();

      const geo = new THREE.ExtrudeGeometry(shape, {
        depth: 0.020,
        bevelEnabled: true,
        bevelThickness: 0.003,
        bevelSize: 0.003,
        bevelSegments: 3,
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
      const shape = new THREE.Shape();
      shape.moveTo(0, 0);
      shape.lineTo(0.38, 0);
      shape.quadraticCurveTo(0.36, 0.05, 0.34, 0.10);
      shape.lineTo(0.32, 0.24);
      shape.quadraticCurveTo(0.28, 0.32, 0.18, 0.33);
      shape.quadraticCurveTo(0.10, 0.33, 0.06, 0.30);
      shape.quadraticCurveTo(0.02, 0.26, 0, 0.20);
      shape.closePath();

      const geo = new THREE.ExtrudeGeometry(shape, {
        depth: 0.020,
        bevelEnabled: true,
        bevelThickness: 0.003,
        bevelSize: 0.003,
        bevelSegments: 3,
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

      // Wide, thick rear wing
      const geo = buildWingElement(0.26, 0.92, 0.16, 0.07);
      const mesh = new THREE.Mesh(geo, mat());
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      addEdgeLines(mesh);
      group.add(mesh);

      // Swan-neck mounts — curved pylons from top
      const mountH = 0.34;
      const mountCurveL = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.18, 0, 0),
        new THREE.Vector3(-0.17, -mountH * 0.3, 0.01),
        new THREE.Vector3(-0.16, -mountH * 0.7, 0.015),
        new THREE.Vector3(-0.15, -mountH, 0.02),
      ]);
      const mountGeoL = new THREE.TubeGeometry(mountCurveL, 12, 0.014, 8, false);
      const mountL = new THREE.Mesh(mountGeoL, mat({ opacity: 0.94 }));
      mountL.castShadow = true;
      addEdgeLines(mountL);
      group.add(mountL);

      const mountCurveR = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.18, 0, 0),
        new THREE.Vector3(0.17, -mountH * 0.3, 0.01),
        new THREE.Vector3(0.16, -mountH * 0.7, 0.015),
        new THREE.Vector3(0.15, -mountH, 0.02),
      ]);
      const mountGeoR = new THREE.TubeGeometry(mountCurveR, 12, 0.014, 8, false);
      const mountR = new THREE.Mesh(mountGeoR, mat({ opacity: 0.94 }));
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

      // Tall endplate with swept leading edge
      const shape = new THREE.Shape();
      shape.moveTo(0, 0);
      shape.lineTo(0.36, 0);
      shape.quadraticCurveTo(0.37, 0.06, 0.36, 0.12);
      shape.lineTo(0.34, 0.36);
      shape.quadraticCurveTo(0.32, 0.46, 0.24, 0.50);
      shape.quadraticCurveTo(0.16, 0.52, 0.10, 0.50);
      shape.quadraticCurveTo(0.04, 0.46, 0.02, 0.40);
      shape.lineTo(0, 0.36);
      shape.closePath();

      const geo = new THREE.ExtrudeGeometry(shape, {
        depth: 0.020,
        bevelEnabled: true,
        bevelThickness: 0.004,
        bevelSize: 0.004,
        bevelSegments: 3,
      });
      geo.center();
      const mesh = new THREE.Mesh(geo, mat());
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      addEdgeLines(mesh);
      group.add(mesh);

      // Rear light strip
      const lightGeo = new THREE.BoxGeometry(0.14, 0.025, 0.016);
      const lightMesh = new THREE.Mesh(lightGeo, mat({
        color: '#cc2222',
        emissive: '#cc2222',
        emissiveIntensity: 0.3,
        opacity: 0.98,
      }));
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

      const shape = new THREE.Shape();
      shape.moveTo(0, 0);
      shape.lineTo(0.36, 0);
      shape.quadraticCurveTo(0.37, 0.06, 0.36, 0.12);
      shape.lineTo(0.34, 0.36);
      shape.quadraticCurveTo(0.32, 0.46, 0.24, 0.50);
      shape.quadraticCurveTo(0.16, 0.52, 0.10, 0.50);
      shape.quadraticCurveTo(0.04, 0.46, 0.02, 0.40);
      shape.lineTo(0, 0.36);
      shape.closePath();

      const geo = new THREE.ExtrudeGeometry(shape, {
        depth: 0.020,
        bevelEnabled: true,
        bevelThickness: 0.004,
        bevelSize: 0.004,
        bevelSegments: 3,
      });
      geo.center();
      const mesh = new THREE.Mesh(geo, mat());
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      addEdgeLines(mesh);
      group.add(mesh);

      const lightGeo = new THREE.BoxGeometry(0.14, 0.025, 0.016);
      const lightMesh = new THREE.Mesh(lightGeo, mat({
        color: '#cc2222',
        emissive: '#cc2222',
        emissiveIntensity: 0.3,
        opacity: 0.98,
      }));
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
      return buildSidepod({ addEdgeLines });
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
      return buildSidepod({ addEdgeLines });
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

      const geo = buildWingElement(0.12, 0.68, 0.12, 0.05);
      const mesh = new THREE.Mesh(geo, mat());
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      addEdgeLines(mesh);
      group.add(mesh);

      // Mounting pylons
      const pylonGeoL = new THREE.BoxGeometry(0.018, 0.08, 0.028);
      const pylonL = new THREE.Mesh(pylonGeoL, mat({ opacity: 0.93 }));
      pylonL.position.set(-0.15, -0.05, 0);
      pylonL.castShadow = true;
      group.add(pylonL);

      const pylonGeoR = new THREE.BoxGeometry(0.018, 0.08, 0.028);
      const pylonR = new THREE.Mesh(pylonGeoR, mat({ opacity: 0.93 }));
      pylonR.position.set(0.15, -0.05, 0);
      pylonR.castShadow = true;
      group.add(pylonR);

      return group;
    },
  },
];
