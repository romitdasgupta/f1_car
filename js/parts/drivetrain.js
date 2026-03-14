// ============================================================
//  Drivetrain parts — gearbox, clutch, differential, shafts
//  Color: #E76F51 (burnt orange)
// ============================================================

import * as THREE from 'three';
import { addEdgeLines } from '../geometry/factories.js';

const GROUP = 'drivetrain';
const COLOR = '#E76F51';

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

export const drivetrainParts = [
  // ---- Gearbox Housing --------------------------------------
  {
    id: 'gearboxHousing',
    name: 'Gearbox Housing',
    group: GROUP,
    description: 'Carbon-fibre gearbox casing — structural rear end of the car, also mounts rear suspension.',
    assembledPosition: [0, 0.3, 2.0],
    assembledRotation: [0, 0, 0],
    explosionDirection: [0, 0.3, 0.8],
    build({ addEdgeLines }) {
      const group = new THREE.Group();

      // Tapered main housing: wider at front, narrower at rear
      const shape = new THREE.Shape();
      shape.moveTo(-0.15, -0.1);
      shape.lineTo(0.15, -0.1);
      shape.lineTo(0.12, 0.12);
      shape.lineTo(-0.12, 0.12);
      shape.closePath();

      const extrudeSettings = { depth: 0.5, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01, bevelSegments: 2 };
      const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      geo.center();
      const mesh = new THREE.Mesh(geo, mat({ metalness: 0.3 }));
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      addEdgeLines(mesh);
      group.add(mesh);

      return group;
    },
  },

  // ---- Gear Cluster -----------------------------------------
  {
    id: 'gearCluster',
    name: 'Gear Cluster',
    group: GROUP,
    description: 'Eight forward gear pairs plus reverse on layshaft and mainshaft — seamless-shift sequential.',
    assembledPosition: [0, 0.3, 2.0],
    assembledRotation: [Math.PI / 2, 0, 0],
    explosionDirection: [0.5, 0.7, 0],
    build({ addEdgeLines }) {
      const group = new THREE.Group();

      // Stack of gear cylinders on two shafts
      const gearMat = mat({ metalness: 0.6, roughness: 0.25 });
      const shaftGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.4, 12);

      // Main shaft
      const mainShaft = new THREE.Mesh(shaftGeo, gearMat);
      mainShaft.position.x = -0.04;
      mainShaft.castShadow = true;
      group.add(mainShaft);

      // Lay shaft
      const layShaft = new THREE.Mesh(shaftGeo.clone(), gearMat);
      layShaft.position.x = 0.04;
      layShaft.castShadow = true;
      group.add(layShaft);

      // Gears on each shaft
      for (let i = 0; i < 8; i++) {
        const r = 0.025 + (i * 0.003);
        const gGeo = new THREE.CylinderGeometry(r, r, 0.02, 16);
        const gear = new THREE.Mesh(gGeo, gearMat);
        gear.position.set(-0.04, -0.17 + i * 0.045, 0);
        gear.castShadow = true;
        group.add(gear);

        const r2 = 0.04 - (i * 0.002);
        const gGeo2 = new THREE.CylinderGeometry(r2, r2, 0.02, 16);
        const gear2 = new THREE.Mesh(gGeo2, gearMat);
        gear2.position.set(0.04, -0.17 + i * 0.045, 0);
        gear2.castShadow = true;
        group.add(gear2);
      }

      addEdgeLines(mainShaft);
      addEdgeLines(layShaft);
      return group;
    },
  },

  // ---- Clutch -----------------------------------------------
  {
    id: 'clutch',
    name: 'Clutch',
    group: GROUP,
    description: 'Multi-plate carbon clutch for race starts and pit stops — paddle-operated.',
    assembledPosition: [0, 0.3, 1.7],
    assembledRotation: [Math.PI / 2, 0, 0],
    explosionDirection: [0, 0, -0.9],
    build({ addEdgeLines }) {
      const group = new THREE.Group();

      // Main clutch disc
      const discGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.02, 32);
      const disc = new THREE.Mesh(discGeo, mat({ metalness: 0.5 }));
      disc.castShadow = true;
      disc.receiveShadow = true;
      addEdgeLines(disc);
      group.add(disc);

      // Pressure plate
      const plateGeo = new THREE.CylinderGeometry(0.075, 0.075, 0.01, 32);
      const plate = new THREE.Mesh(plateGeo, mat({ metalness: 0.6, roughness: 0.3 }));
      plate.position.y = 0.02;
      plate.castShadow = true;
      group.add(plate);

      // Centre hub
      const hubGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.04, 16);
      const hub = new THREE.Mesh(hubGeo, mat({ metalness: 0.7 }));
      hub.castShadow = true;
      group.add(hub);

      return group;
    },
  },

  // ---- Differential -----------------------------------------
  {
    id: 'differential',
    name: 'Differential',
    group: GROUP,
    description: 'Limited-slip differential distributes torque to left and right rear wheels.',
    assembledPosition: [0, 0.25, 2.3],
    assembledRotation: [0, 0, Math.PI / 2],
    explosionDirection: [0, -0.3, 0.9],
    build({ addEdgeLines }) {
      const group = new THREE.Group();

      // Diff housing — sphere-like
      const sphereGeo = new THREE.SphereGeometry(0.06, 24, 16);
      const sphere = new THREE.Mesh(sphereGeo, mat({ metalness: 0.5 }));
      sphere.castShadow = true;
      sphere.receiveShadow = true;
      addEdgeLines(sphere);
      group.add(sphere);

      // Ring gear
      const ringGeo = new THREE.TorusGeometry(0.07, 0.012, 8, 32);
      const ring = new THREE.Mesh(ringGeo, mat({ metalness: 0.6, roughness: 0.25 }));
      ring.rotation.x = Math.PI / 2;
      ring.castShadow = true;
      group.add(ring);

      return group;
    },
  },

  // ---- Half Shaft Left --------------------------------------
  {
    id: 'halfshaftLeft',
    name: 'Half Shaft (Left)',
    group: GROUP,
    description: 'Left rear half shaft transmitting torque from the differential to the left rear wheel.',
    assembledPosition: [-0.5, 0.25, 2.3],
    assembledRotation: [0, 0, Math.PI / 2],
    explosionDirection: [-1, 0, 0],
    build({ addEdgeLines }) {
      const geo = new THREE.CylinderGeometry(0.015, 0.015, 0.45, 12);
      const mesh = new THREE.Mesh(geo, mat({ metalness: 0.6, roughness: 0.25 }));
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      addEdgeLines(mesh);
      return mesh;
    },
  },

  // ---- Half Shaft Right -------------------------------------
  {
    id: 'halfshaftRight',
    name: 'Half Shaft (Right)',
    group: GROUP,
    description: 'Right rear half shaft transmitting torque from the differential to the right rear wheel.',
    assembledPosition: [0.5, 0.25, 2.3],
    assembledRotation: [0, 0, Math.PI / 2],
    explosionDirection: [1, 0, 0],
    build({ addEdgeLines }) {
      const geo = new THREE.CylinderGeometry(0.015, 0.015, 0.45, 12);
      const mesh = new THREE.Mesh(geo, mat({ metalness: 0.6, roughness: 0.25 }));
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      addEdgeLines(mesh);
      return mesh;
    },
  },

  // ---- Driveshaft -------------------------------------------
  {
    id: 'driveshaft',
    name: 'Driveshaft',
    group: GROUP,
    description: 'Main driveshaft connecting the engine output to the gearbox input.',
    assembledPosition: [0, 0.3, 1.5],
    assembledRotation: [Math.PI / 2, 0, 0],
    explosionDirection: [0, 0.5, -0.5],
    build({ addEdgeLines }) {
      const group = new THREE.Group();

      const shaftGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.5, 12);
      const shaft = new THREE.Mesh(shaftGeo, mat({ metalness: 0.6, roughness: 0.2 }));
      shaft.castShadow = true;
      shaft.receiveShadow = true;
      addEdgeLines(shaft);
      group.add(shaft);

      // Universal joint flanges
      const flangeGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.015, 16);
      const flange1 = new THREE.Mesh(flangeGeo, mat({ metalness: 0.7 }));
      flange1.position.y = 0.25;
      flange1.castShadow = true;
      group.add(flange1);

      const flange2 = new THREE.Mesh(flangeGeo.clone(), mat({ metalness: 0.7 }));
      flange2.position.y = -0.25;
      flange2.castShadow = true;
      group.add(flange2);

      return group;
    },
  },

  // ---- Oil Cooler -------------------------------------------
  {
    id: 'oilCooler',
    name: 'Oil Cooler',
    group: GROUP,
    description: 'Gearbox oil cooler with internal fins for maintaining optimal lubricant temperature.',
    assembledPosition: [0.35, 0.4, 2.0],
    assembledRotation: [0, 0, 0],
    explosionDirection: [0.9, 0.3, 0],
    build({ addEdgeLines }) {
      const group = new THREE.Group();

      // Main body
      const bodyGeo = new THREE.BoxGeometry(0.1, 0.12, 0.08);
      const body = new THREE.Mesh(bodyGeo, mat());
      body.castShadow = true;
      body.receiveShadow = true;
      addEdgeLines(body);
      group.add(body);

      // Cooling fins
      const finGeo = new THREE.BoxGeometry(0.1, 0.11, 0.003);
      for (let i = 0; i < 6; i++) {
        const fin = new THREE.Mesh(finGeo, mat({ metalness: 0.5, opacity: 0.6 }));
        fin.position.z = -0.03 + i * 0.012;
        fin.castShadow = true;
        group.add(fin);
      }

      // Inlet/outlet pipes
      const pipeGeo = new THREE.CylinderGeometry(0.01, 0.01, 0.06, 8);
      const pipe1 = new THREE.Mesh(pipeGeo, mat({ metalness: 0.6 }));
      pipe1.position.set(0, 0.05, -0.06);
      pipe1.rotation.x = Math.PI / 2;
      pipe1.castShadow = true;
      group.add(pipe1);

      const pipe2 = new THREE.Mesh(pipeGeo.clone(), mat({ metalness: 0.6 }));
      pipe2.position.set(0, -0.05, -0.06);
      pipe2.rotation.x = Math.PI / 2;
      pipe2.castShadow = true;
      group.add(pipe2);

      return group;
    },
  },
];
