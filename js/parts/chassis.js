// ============================================================
//  Chassis parts — survival cell, halo, floor, crash structures
//  Color: #F4A261 (warm amber)
// ============================================================

import * as THREE from 'three';
import { createMonocoqueShape } from '../geometry/shapes.js';
import { addEdgeLines } from '../geometry/factories.js';

const GROUP = 'chassis';
const COLOR = '#F4A261';

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

export const chassisParts = [
  // ---- Survival Cell (Monocoque) ----------------------------
  {
    id: 'survivalCell',
    name: 'Survival Cell',
    group: GROUP,
    description: 'Carbon-fibre monocoque tub — the structural core of the car that houses and protects the driver.',
    assembledPosition: [0, 0.25, 0],
    assembledRotation: [0, 0, 0],
    explosionDirection: [0, 1, 0],
    build({ addEdgeLines }) {
      const shape = createMonocoqueShape(0.55, 0.45);
      const extrudeSettings = {
        depth: 3.2,
        bevelEnabled: true,
        bevelThickness: 0.02,
        bevelSize: 0.02,
        bevelSegments: 3,
      };
      const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      geo.center();
      const mesh = new THREE.Mesh(geo, mat());
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      addEdgeLines(mesh);
      return mesh;
    },
  },

  // ---- Halo -------------------------------------------------
  {
    id: 'halo',
    name: 'Halo',
    group: GROUP,
    description: 'Titanium safety halo — a wishbone-shaped bar above the cockpit that deflects debris.',
    assembledPosition: [0, 0.7, -0.6],
    assembledRotation: [0, 0, 0],
    explosionDirection: [0, 1, -0.3],
    build({ addEdgeLines }) {
      const group = new THREE.Group();
      // Main hoop curve
      const pts = [
        new THREE.Vector3(0, 0, 0.4),       // rear mount
        new THREE.Vector3(-0.18, 0.15, 0.1),
        new THREE.Vector3(-0.2, 0.2, -0.2),
        new THREE.Vector3(-0.12, 0.18, -0.5),
        new THREE.Vector3(0, 0.15, -0.6),    // front tip
        new THREE.Vector3(0.12, 0.18, -0.5),
        new THREE.Vector3(0.2, 0.2, -0.2),
        new THREE.Vector3(0.18, 0.15, 0.1),
        new THREE.Vector3(0, 0, 0.4),       // close back to rear mount
      ];
      const curve = new THREE.CatmullRomCurve3(pts, false);
      const tubeGeo = new THREE.TubeGeometry(curve, 64, 0.025, 12, false);
      const mesh = new THREE.Mesh(tubeGeo, mat({ metalness: 0.6, roughness: 0.25 }));
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      addEdgeLines(mesh);

      // Central strut from front attachment down
      const strutGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.25, 8);
      const strut = new THREE.Mesh(strutGeo, mat({ metalness: 0.6, roughness: 0.25 }));
      strut.position.set(0, -0.05, -0.6);
      strut.rotation.x = -0.3;
      strut.castShadow = true;
      strut.receiveShadow = true;

      group.add(mesh, strut);
      return group;
    },
  },

  // ---- Floor ------------------------------------------------
  {
    id: 'floor',
    name: 'Floor',
    group: GROUP,
    description: 'Flat underbody floor panel that manages airflow beneath the car to generate ground effect downforce.',
    assembledPosition: [0, 0.02, 0.2],
    assembledRotation: [0, 0, 0],
    explosionDirection: [0, -1, 0],
    build({ addEdgeLines }) {
      // Shaped floor — wider in the middle, tapers front and rear
      const shape = new THREE.Shape();
      shape.moveTo(-0.45, -2.4);
      shape.lineTo(0.45, -2.4);
      shape.lineTo(0.7, -1.5);
      shape.lineTo(0.8, 0);
      shape.lineTo(0.75, 1.5);
      shape.lineTo(0.5, 2.2);
      shape.lineTo(-0.5, 2.2);
      shape.lineTo(-0.75, 1.5);
      shape.lineTo(-0.8, 0);
      shape.lineTo(-0.7, -1.5);
      shape.lineTo(-0.45, -2.4);

      const extrudeSettings = { depth: 0.03, bevelEnabled: false };
      const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      // Rotate so it lies flat (shape is in XY, need it in XZ)
      geo.rotateX(-Math.PI / 2);
      geo.computeBoundingBox();
      geo.center();
      const mesh = new THREE.Mesh(geo, mat());
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      addEdgeLines(mesh);
      return mesh;
    },
  },

  // ---- Diffuser ---------------------------------------------
  {
    id: 'diffuser',
    name: 'Diffuser',
    group: GROUP,
    description: 'Rear under-body ramp that accelerates airflow to create low pressure and additional downforce.',
    assembledPosition: [0, 0.1, 2.2],
    assembledRotation: [0, 0, 0],
    explosionDirection: [0, -0.7, 0.7],
    build({ addEdgeLines }) {
      const group = new THREE.Group();
      // Multiple channels
      const channelCount = 5;
      const totalWidth = 0.9;
      const channelWidth = totalWidth / channelCount;

      for (let i = 0; i < channelCount; i++) {
        const shape = new THREE.Shape();
        shape.moveTo(0, 0);
        shape.lineTo(channelWidth * 0.85, 0);
        shape.lineTo(channelWidth * 0.85, 0.02);
        shape.lineTo(0, 0.02);
        shape.lineTo(0, 0);

        const path = new THREE.CatmullRomCurve3([
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(0, 0.05, 0.15),
          new THREE.Vector3(0, 0.18, 0.4),
        ]);
        const extrudeSettings = {
          steps: 20,
          extrudePath: path,
          bevelEnabled: false,
        };
        const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        const mesh = new THREE.Mesh(geo, mat());
        mesh.position.x = -totalWidth / 2 + i * channelWidth + channelWidth * 0.075;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        addEdgeLines(mesh);
        group.add(mesh);
      }
      return group;
    },
  },

  // ---- Front Crash Structure --------------------------------
  {
    id: 'frontCrashStructure',
    name: 'Front Crash Structure',
    group: GROUP,
    description: 'Deformable impact-absorbing nose cone structure designed to crumple progressively on impact.',
    assembledPosition: [0, 0.2, -2.5],
    assembledRotation: [0, 0, 0],
    explosionDirection: [0, 0, -1],
    build({ addEdgeLines }) {
      // Tapered nose cone
      const geo = new THREE.CylinderGeometry(0.04, 0.1, 0.6, 8);
      geo.rotateX(Math.PI / 2);
      const mesh = new THREE.Mesh(geo, mat());
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      addEdgeLines(mesh);
      return mesh;
    },
  },

  // ---- Rear Crash Structure ---------------------------------
  {
    id: 'rearCrashStructure',
    name: 'Rear Crash Structure',
    group: GROUP,
    description: 'Rear impact attenuator mounted behind the gearbox to absorb rear-end collision energy.',
    assembledPosition: [0, 0.3, 2.6],
    assembledRotation: [0, 0, 0],
    explosionDirection: [0, 0, 1],
    build({ addEdgeLines }) {
      const geo = new THREE.BoxGeometry(0.18, 0.12, 0.3);
      // Taper it slightly by adjusting vertices would be complex;
      // use a combination instead
      const group = new THREE.Group();
      const box = new THREE.Mesh(geo, mat());
      box.castShadow = true;
      box.receiveShadow = true;
      addEdgeLines(box);

      // Add a small cylinder cap
      const capGeo = new THREE.CylinderGeometry(0.08, 0.06, 0.1, 8);
      capGeo.rotateX(Math.PI / 2);
      const cap = new THREE.Mesh(capGeo, mat());
      cap.position.z = 0.2;
      cap.castShadow = true;
      cap.receiveShadow = true;
      group.add(box, cap);
      return group;
    },
  },

  // ---- Roll Hoop (Airbox Intake) ----------------------------
  {
    id: 'rollHoop',
    name: 'Roll Hoop',
    group: GROUP,
    description: 'Roll-over protection structure doubling as the engine airbox intake above the driver\'s head.',
    assembledPosition: [0, 0.85, 0.2],
    assembledRotation: [0, 0, 0],
    explosionDirection: [0, 1, 0.3],
    build({ addEdgeLines }) {
      const group = new THREE.Group();

      // Triangular intake shape
      const shape = new THREE.Shape();
      shape.moveTo(-0.08, 0);
      shape.lineTo(0.08, 0);
      shape.lineTo(0.05, 0.15);
      shape.quadraticCurveTo(0, 0.2, -0.05, 0.15);
      shape.lineTo(-0.08, 0);

      const extrudeSettings = { depth: 0.18, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01, bevelSegments: 2 };
      const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      geo.center();
      const mesh = new THREE.Mesh(geo, mat());
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      addEdgeLines(mesh);

      // Support pillar
      const pillarGeo = new THREE.CylinderGeometry(0.03, 0.04, 0.25, 8);
      const pillar = new THREE.Mesh(pillarGeo, mat());
      pillar.position.y = -0.2;
      pillar.castShadow = true;
      pillar.receiveShadow = true;
      group.add(mesh, pillar);
      return group;
    },
  },

  // ---- Cockpit Surround ------------------------------------
  {
    id: 'cockpitSurround',
    name: 'Cockpit Surround',
    group: GROUP,
    description: 'Raised cockpit lip and surround forming the opening where the driver sits.',
    assembledPosition: [0, 0.5, -0.3],
    assembledRotation: [0, 0, 0],
    explosionDirection: [0, 0.8, -0.5],
    build({ addEdgeLines }) {
      // Oval ring
      const outerShape = new THREE.Shape();
      outerShape.absellipse(0, 0, 0.25, 0.4, 0, Math.PI * 2, false, 0);
      const innerHole = new THREE.Path();
      innerHole.absellipse(0, 0, 0.2, 0.35, 0, Math.PI * 2, false, 0);
      outerShape.holes.push(innerHole);

      const extrudeSettings = { depth: 0.08, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01, bevelSegments: 2 };
      const geo = new THREE.ExtrudeGeometry(outerShape, extrudeSettings);
      geo.rotateX(-Math.PI / 2);
      geo.center();
      const mesh = new THREE.Mesh(geo, mat());
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      addEdgeLines(mesh);
      return mesh;
    },
  },
];
