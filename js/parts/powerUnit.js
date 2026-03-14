// ============================================================
//  Power Unit parts — V6, turbo, MGU-H/K, energy store, etc.
//  Color: #E63946 (red)
//  ALL parts positioned INSIDE the bodywork when assembled
// ============================================================

import * as THREE from 'three';
import { createTurboSection, addEdgeLines } from '../geometry/factories.js';

const GROUP = 'powerUnit';
const COLOR = '#E63946';

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

export const powerUnitParts = [
  // ---- Engine Block -----------------------------------------
  {
    id: 'engineBlock',
    name: 'Engine Block',
    group: GROUP,
    description: 'V6 1.6-litre turbocharged internal combustion engine block — the heart of the hybrid power unit.',
    assembledPosition: [0, 0.2, 0.85],
    assembledRotation: [0, 0, 0],
    explosionDirection: [0, 0.5, 0.5],
    build({ addEdgeLines }) {
      const group = new THREE.Group();

      // Main block body — fits inside monocoque/engine cover
      const blockGeo = new THREE.BoxGeometry(0.26, 0.2, 0.55);
      const block = new THREE.Mesh(blockGeo, mat({ metalness: 0.4 }));
      block.castShadow = true;
      block.receiveShadow = true;
      addEdgeLines(block);
      group.add(block);

      // Cylinder bank representation (V-shape)
      const cylGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.3, 12);
      for (let i = 0; i < 3; i++) {
        const cylL = new THREE.Mesh(cylGeo, mat({ metalness: 0.5 }));
        cylL.position.set(-0.06, 0.12, -0.15 + i * 0.15);
        cylL.rotation.z = 0.45;
        cylL.castShadow = true;
        cylL.receiveShadow = true;
        group.add(cylL);

        const cylR = new THREE.Mesh(cylGeo.clone(), mat({ metalness: 0.5 }));
        cylR.position.set(0.06, 0.12, -0.15 + i * 0.15);
        cylR.rotation.z = -0.45;
        cylR.castShadow = true;
        cylR.receiveShadow = true;
        group.add(cylR);
      }

      return group;
    },
  },

  // ---- Cylinder Head Left -----------------------------------
  {
    id: 'cylinderHeadLeft',
    name: 'Cylinder Head (Left)',
    group: GROUP,
    description: 'Left cylinder head housing intake/exhaust valves and camshaft for the left bank of the V6.',
    assembledPosition: [-0.15, 0.32, 0.85],
    assembledRotation: [0, 0, 0.4],
    explosionDirection: [-0.8, 0.5, 0],
    build({ addEdgeLines }) {
      const geo = new THREE.BoxGeometry(0.1, 0.05, 0.45);
      const mesh = new THREE.Mesh(geo, mat({ metalness: 0.35 }));
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      addEdgeLines(mesh);
      return mesh;
    },
  },

  // ---- Cylinder Head Right ----------------------------------
  {
    id: 'cylinderHeadRight',
    name: 'Cylinder Head (Right)',
    group: GROUP,
    description: 'Right cylinder head housing intake/exhaust valves and camshaft for the right bank of the V6.',
    assembledPosition: [0.15, 0.32, 0.85],
    assembledRotation: [0, 0, -0.4],
    explosionDirection: [0.8, 0.5, 0],
    build({ addEdgeLines }) {
      const geo = new THREE.BoxGeometry(0.1, 0.05, 0.45);
      const mesh = new THREE.Mesh(geo, mat({ metalness: 0.35 }));
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      addEdgeLines(mesh);
      return mesh;
    },
  },

  // ---- Turbo Compressor -------------------------------------
  {
    id: 'turboCompressor',
    name: 'Turbo Compressor',
    group: GROUP,
    description: 'Compressor section of the turbocharger — compresses intake air for increased engine power.',
    assembledPosition: [0, 0.2, 0.5],
    assembledRotation: [Math.PI / 2, 0, 0],
    explosionDirection: [0, 0.5, -0.8],
    build({ addEdgeLines }) {
      const mesh = createTurboSection('compressor');
      mesh.material = mat({ metalness: 0.7, roughness: 0.2 });
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      addEdgeLines(mesh);
      return mesh;
    },
  },

  // ---- Turbo Turbine ----------------------------------------
  {
    id: 'turboTurbine',
    name: 'Turbo Turbine',
    group: GROUP,
    description: 'Turbine section of the turbocharger — driven by exhaust gases to spin the compressor.',
    assembledPosition: [0, 0.2, 1.2],
    assembledRotation: [Math.PI / 2, 0, 0],
    explosionDirection: [0, 0.5, 0.8],
    build({ addEdgeLines }) {
      const mesh = createTurboSection('turbine');
      mesh.material = mat({ metalness: 0.7, roughness: 0.2 });
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      addEdgeLines(mesh);
      return mesh;
    },
  },

  // ---- MGU-H ------------------------------------------------
  {
    id: 'mguH',
    name: 'MGU-H',
    group: GROUP,
    description: 'Motor Generator Unit — Heat: harvests energy from the turbo and can spin it up to eliminate turbo lag.',
    assembledPosition: [0, 0.2, 0.85],
    assembledRotation: [Math.PI / 2, 0, 0],
    explosionDirection: [0.6, 0.6, 0],
    build({ addEdgeLines }) {
      const group = new THREE.Group();

      const cylGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.12, 24);
      const cyl = new THREE.Mesh(cylGeo, mat({ metalness: 0.5 }));
      cyl.castShadow = true;
      cyl.receiveShadow = true;
      addEdgeLines(cyl);
      group.add(cyl);

      const torusGeo = new THREE.TorusGeometry(0.055, 0.01, 12, 32);
      const torus = new THREE.Mesh(torusGeo, mat({ metalness: 0.6, color: '#CC2233' }));
      torus.castShadow = true;
      torus.receiveShadow = true;
      group.add(torus);

      return group;
    },
  },

  // ---- MGU-K ------------------------------------------------
  {
    id: 'mguK',
    name: 'MGU-K',
    group: GROUP,
    description: 'Motor Generator Unit — Kinetic: recovers braking energy and provides additional drive torque.',
    assembledPosition: [0, 0.15, 1.3],
    assembledRotation: [Math.PI / 2, 0, 0],
    explosionDirection: [0, -0.5, 0.7],
    build({ addEdgeLines }) {
      const group = new THREE.Group();

      const cylGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.1, 24);
      const cyl = new THREE.Mesh(cylGeo, mat({ metalness: 0.5 }));
      cyl.castShadow = true;
      cyl.receiveShadow = true;
      addEdgeLines(cyl);
      group.add(cyl);

      const torusGeo = new THREE.TorusGeometry(0.05, 0.008, 12, 32);
      const torus = new THREE.Mesh(torusGeo, mat({ metalness: 0.6, color: '#CC2233' }));
      torus.position.y = 0.025;
      torus.castShadow = true;
      torus.receiveShadow = true;
      group.add(torus);

      return group;
    },
  },

  // ---- Exhaust Manifold -------------------------------------
  {
    id: 'exhaustManifold',
    name: 'Exhaust Manifold',
    group: GROUP,
    description: 'Collects exhaust gases from all six cylinders and channels them to the turbo turbine.',
    assembledPosition: [0, 0.32, 1.1],
    assembledRotation: [0, 0, 0],
    explosionDirection: [0, 0.8, 0.5],
    build({ addEdgeLines }) {
      const group = new THREE.Group();

      // Main collector pipe
      const mainPts = [
        new THREE.Vector3(-0.1, 0, -0.15),
        new THREE.Vector3(-0.05, 0.04, -0.05),
        new THREE.Vector3(0, 0.05, 0.08),
        new THREE.Vector3(0, 0.02, 0.2),
      ];
      const mainCurve = new THREE.CatmullRomCurve3(mainPts);
      const mainGeo = new THREE.TubeGeometry(mainCurve, 24, 0.025, 10, false);
      const main = new THREE.Mesh(mainGeo, mat({ metalness: 0.6, roughness: 0.25 }));
      main.castShadow = true;
      main.receiveShadow = true;
      addEdgeLines(main);
      group.add(main);

      // Secondary branch (right bank)
      const secPts = [
        new THREE.Vector3(0.1, 0, -0.15),
        new THREE.Vector3(0.05, 0.04, -0.05),
        new THREE.Vector3(0, 0.05, 0.08),
      ];
      const secCurve = new THREE.CatmullRomCurve3(secPts);
      const secGeo = new THREE.TubeGeometry(secCurve, 20, 0.02, 10, false);
      const sec = new THREE.Mesh(secGeo, mat({ metalness: 0.6, roughness: 0.25 }));
      sec.castShadow = true;
      sec.receiveShadow = true;
      group.add(sec);

      return group;
    },
  },

  // ---- Intake Plenum ----------------------------------------
  {
    id: 'intakePlenum',
    name: 'Intake Plenum',
    group: GROUP,
    description: 'Air distribution chamber that evenly feeds compressed air to all six intake runners.',
    assembledPosition: [0, 0.38, 0.7],
    assembledRotation: [0, 0, 0],
    explosionDirection: [0, 0.9, -0.3],
    build({ addEdgeLines }) {
      const shape = new THREE.Shape();
      const w = 0.1, h = 0.06, r = 0.015;
      shape.moveTo(-w + r, -h);
      shape.lineTo(w - r, -h);
      shape.quadraticCurveTo(w, -h, w, -h + r);
      shape.lineTo(w, h - r);
      shape.quadraticCurveTo(w, h, w - r, h);
      shape.lineTo(-w + r, h);
      shape.quadraticCurveTo(-w, h, -w, h - r);
      shape.lineTo(-w, -h + r);
      shape.quadraticCurveTo(-w, -h, -w + r, -h);

      const extrudeSettings = { depth: 0.2, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.008, bevelSegments: 2 };
      const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      geo.center();
      const mesh = new THREE.Mesh(geo, mat());
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      addEdgeLines(mesh);
      return mesh;
    },
  },

  // ---- Oil Tank ---------------------------------------------
  {
    id: 'oilTank',
    name: 'Oil Tank',
    group: GROUP,
    description: 'Dry-sump oil reservoir that stores and circulates lubricant for the engine and turbo bearings.',
    assembledPosition: [0.18, 0.18, 1.1],
    assembledRotation: [0, 0, 0],
    explosionDirection: [0.8, 0, 0.4],
    build({ addEdgeLines }) {
      const pts = [
        new THREE.Vector2(0, -0.07),
        new THREE.Vector2(0.04, -0.06),
        new THREE.Vector2(0.055, -0.025),
        new THREE.Vector2(0.055, 0.025),
        new THREE.Vector2(0.04, 0.06),
        new THREE.Vector2(0, 0.07),
      ];
      const geo = new THREE.LatheGeometry(pts, 24);
      const mesh = new THREE.Mesh(geo, mat());
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      addEdgeLines(mesh);
      return mesh;
    },
  },

  // ---- Energy Store (Battery) -------------------------------
  {
    id: 'energyStore',
    name: 'Energy Store',
    group: GROUP,
    description: 'Lithium-ion battery pack storing up to 4 MJ of harvested energy per lap for deployment.',
    assembledPosition: [0, 0.08, 0.3],
    assembledRotation: [0, 0, 0],
    explosionDirection: [0, -0.8, -0.5],
    build({ addEdgeLines }) {
      const geo = new THREE.BoxGeometry(0.24, 0.08, 0.22, 2, 2, 2);
      const mesh = new THREE.Mesh(geo, mat());
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      addEdgeLines(mesh);
      return mesh;
    },
  },

  // ---- Control Electronics ----------------------------------
  {
    id: 'controlElectronics',
    name: 'Control Electronics',
    group: GROUP,
    description: 'Standard Electronic Control Unit (SECU) — manages engine mapping, ERS deployment, and telemetry.',
    assembledPosition: [0.15, 0.3, 0.6],
    assembledRotation: [0, 0, 0],
    explosionDirection: [0.7, 0.5, -0.3],
    build({ addEdgeLines }) {
      const group = new THREE.Group();

      const boxGeo = new THREE.BoxGeometry(0.08, 0.05, 0.1);
      const box = new THREE.Mesh(boxGeo, mat({ metalness: 0.3 }));
      box.castShadow = true;
      box.receiveShadow = true;
      addEdgeLines(box);
      group.add(box);

      // Connector nubs
      const connGeo = new THREE.CylinderGeometry(0.006, 0.006, 0.025, 6);
      for (let i = 0; i < 3; i++) {
        const conn = new THREE.Mesh(connGeo, mat({ color: '#AA2233' }));
        conn.position.set(-0.025 + i * 0.025, 0.035, 0);
        conn.castShadow = true;
        group.add(conn);
      }

      return group;
    },
  },
];
