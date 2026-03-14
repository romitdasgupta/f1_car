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
    opacity: 0.95,
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
    assembledPosition: [0, 0.15, -0.25],
    assembledRotation: [0, 0, 0],
    explosionDirection: [0, 1, 0],
    build({ addEdgeLines }) {
      const group = new THREE.Group();

      // Main monocoque tub — tapered shape, wider at front (cockpit), narrower at rear
      // Use a custom shape for cross-section that is wide and low
      const shape = new THREE.Shape();
      // Low, wide tub cross-section
      const w = 0.28, h = 0.32, r = 0.04;
      shape.moveTo(-w + r, 0);
      shape.lineTo(w - r, 0);
      shape.quadraticCurveTo(w, 0, w, r);
      shape.lineTo(w * 0.7, h - r);
      shape.quadraticCurveTo(w * 0.7, h, w * 0.7 - r, h);
      shape.lineTo(-w * 0.7 + r, h);
      shape.quadraticCurveTo(-w * 0.7, h, -w * 0.7, h - r);
      shape.lineTo(-w, r);
      shape.quadraticCurveTo(-w, 0, -w + r, 0);

      const extrudeSettings = {
        depth: 2.5, // Z from -1.5 to +1.0
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
      group.add(mesh);

      // Engine cover — smooth upper bodywork over the engine area (Z ~ 0.3 to 1.5)
      const coverShape = new THREE.Shape();
      coverShape.moveTo(-0.24, 0);
      coverShape.lineTo(0.24, 0);
      coverShape.lineTo(0.18, 0.22);
      coverShape.quadraticCurveTo(0, 0.28, -0.18, 0.22);
      coverShape.lineTo(-0.24, 0);

      const coverGeo = new THREE.ExtrudeGeometry(coverShape, {
        depth: 1.5,
        bevelEnabled: true,
        bevelThickness: 0.01,
        bevelSize: 0.01,
        bevelSegments: 2,
      });
      coverGeo.center();
      const cover = new THREE.Mesh(coverGeo, mat({ opacity: 0.92 }));
      cover.position.set(0, 0.16, 0.65);
      cover.castShadow = true;
      cover.receiveShadow = true;
      addEdgeLines(cover);
      group.add(cover);

      // Nose cone upper bodywork — from front of monocoque forward
      const noseShape = new THREE.Shape();
      noseShape.moveTo(-0.22, 0);
      noseShape.lineTo(0.22, 0);
      noseShape.lineTo(0.15, 0.18);
      noseShape.quadraticCurveTo(0, 0.22, -0.15, 0.18);
      noseShape.lineTo(-0.22, 0);

      // Extrude along a path that tapers
      const nosePath = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, -0.02, -0.4),
        new THREE.Vector3(0, -0.04, -0.8),
        new THREE.Vector3(0, -0.06, -1.0),
      ]);
      const noseGeo = new THREE.TubeGeometry(nosePath, 20, 0.12, 8, false);
      const nose = new THREE.Mesh(noseGeo, mat());
      nose.position.set(0, 0.18, -1.05);
      nose.castShadow = true;
      nose.receiveShadow = true;
      addEdgeLines(nose);
      group.add(nose);

      return group;
    },
  },

  // ---- Halo -------------------------------------------------
  {
    id: 'halo',
    name: 'Halo',
    group: GROUP,
    description: 'Titanium safety halo — a wishbone-shaped bar above the cockpit that deflects debris.',
    assembledPosition: [0, 0.55, -0.5],
    assembledRotation: [0, 0, 0],
    explosionDirection: [0, 1, -0.3],
    build({ addEdgeLines }) {
      const group = new THREE.Group();
      // Main hoop curve — wider, properly shaped
      const pts = [
        new THREE.Vector3(0, 0, 0.3),       // rear mount on cockpit rim
        new THREE.Vector3(-0.16, 0.12, 0.1),
        new THREE.Vector3(-0.18, 0.18, -0.15),
        new THREE.Vector3(-0.12, 0.16, -0.4),
        new THREE.Vector3(0, 0.14, -0.5),    // front tip
        new THREE.Vector3(0.12, 0.16, -0.4),
        new THREE.Vector3(0.18, 0.18, -0.15),
        new THREE.Vector3(0.16, 0.12, 0.1),
        new THREE.Vector3(0, 0, 0.3),       // close back to rear mount
      ];
      const curve = new THREE.CatmullRomCurve3(pts, false);
      const tubeGeo = new THREE.TubeGeometry(curve, 64, 0.022, 12, false);
      const mesh = new THREE.Mesh(tubeGeo, mat({ metalness: 0.6, roughness: 0.25 }));
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      addEdgeLines(mesh);

      // Central strut from front down to cockpit rim
      const strutPts = [
        new THREE.Vector3(0, 0.14, -0.5),
        new THREE.Vector3(0, 0.02, -0.55),
        new THREE.Vector3(0, -0.1, -0.5),
      ];
      const strutCurve = new THREE.CatmullRomCurve3(strutPts);
      const strutGeo = new THREE.TubeGeometry(strutCurve, 12, 0.018, 8, false);
      const strut = new THREE.Mesh(strutGeo, mat({ metalness: 0.6, roughness: 0.25 }));
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
    assembledPosition: [0, 0.02, 0.3],
    assembledRotation: [0, 0, 0],
    explosionDirection: [0, -1, 0],
    build({ addEdgeLines }) {
      // Shaped floor — very wide, spanning from front axle to rear
      const shape = new THREE.Shape();
      // Front axle area (Z = -1.5) to rear (Z = +2.2)
      shape.moveTo(-0.35, -1.5);  // front left (narrower at nose)
      shape.lineTo(0.35, -1.5);   // front right
      shape.lineTo(0.65, -0.8);   // widens behind front wheels
      shape.lineTo(0.85, -0.3);   // full width at sidepod inlet
      shape.lineTo(0.85, 1.2);    // along sidepods
      shape.lineTo(0.7, 1.8);     // narrows toward rear
      shape.lineTo(0.5, 2.2);     // rear
      shape.lineTo(-0.5, 2.2);
      shape.lineTo(-0.7, 1.8);
      shape.lineTo(-0.85, 1.2);
      shape.lineTo(-0.85, -0.3);
      shape.lineTo(-0.65, -0.8);
      shape.lineTo(-0.35, -1.5);

      const extrudeSettings = { depth: 0.02, bevelEnabled: false };
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
    assembledPosition: [0, 0.08, 2.15],
    assembledRotation: [0, 0, 0],
    explosionDirection: [0, -0.7, 0.7],
    build({ addEdgeLines }) {
      const group = new THREE.Group();
      // Multiple channels forming the diffuser ramp
      const channelCount = 7;
      const totalWidth = 1.0;
      const channelWidth = totalWidth / channelCount;

      for (let i = 0; i < channelCount; i++) {
        const shape = new THREE.Shape();
        shape.moveTo(0, 0);
        shape.lineTo(channelWidth * 0.85, 0);
        shape.lineTo(channelWidth * 0.85, 0.015);
        shape.lineTo(0, 0.015);
        shape.lineTo(0, 0);

        const path = new THREE.CatmullRomCurve3([
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(0, 0.04, 0.15),
          new THREE.Vector3(0, 0.12, 0.35),
          new THREE.Vector3(0, 0.2, 0.5),
        ]);
        const extrudeSettings = {
          steps: 24,
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
    assembledPosition: [0, 0.12, -2.1],
    assembledRotation: [0, 0, 0],
    explosionDirection: [0, 0, -1],
    build({ addEdgeLines }) {
      // Long tapered nose extending forward from monocoque
      const group = new THREE.Group();

      // Main nose cone — tapers from monocoque width to narrow tip
      const nosePath = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0, 0.3),    // at monocoque front
        new THREE.Vector3(0, -0.01, 0),
        new THREE.Vector3(0, -0.02, -0.3),
        new THREE.Vector3(0, -0.03, -0.5),  // tip
      ]);
      // Use tube geometry tapering from radius 0.1 to 0.03
      const frames = nosePath.computeFrenetFrames(20, false);
      const noseGeo = new THREE.TubeGeometry(nosePath, 20, 0.06, 8, false);
      const nose = new THREE.Mesh(noseGeo, mat());
      nose.castShadow = true;
      nose.receiveShadow = true;
      addEdgeLines(nose);
      group.add(nose);

      // Nose tip cap
      const tipGeo = new THREE.SphereGeometry(0.04, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2);
      const tip = new THREE.Mesh(tipGeo, mat());
      tip.position.set(0, -0.03, -0.5);
      tip.rotation.x = Math.PI / 2;
      tip.castShadow = true;
      group.add(tip);

      return group;
    },
  },

  // ---- Rear Crash Structure ---------------------------------
  {
    id: 'rearCrashStructure',
    name: 'Rear Crash Structure',
    group: GROUP,
    description: 'Rear impact attenuator mounted behind the gearbox to absorb rear-end collision energy.',
    assembledPosition: [0, 0.28, 2.5],
    assembledRotation: [0, 0, 0],
    explosionDirection: [0, 0, 1],
    build({ addEdgeLines }) {
      const group = new THREE.Group();

      const geo = new THREE.BoxGeometry(0.14, 0.1, 0.2);
      const box = new THREE.Mesh(geo, mat());
      box.castShadow = true;
      box.receiveShadow = true;
      addEdgeLines(box);

      // Tapered rear cap
      const capGeo = new THREE.CylinderGeometry(0.05, 0.04, 0.08, 8);
      capGeo.rotateX(Math.PI / 2);
      const cap = new THREE.Mesh(capGeo, mat());
      cap.position.z = 0.14;
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
    assembledPosition: [0, 0.7, -0.1],
    assembledRotation: [0, 0, 0],
    explosionDirection: [0, 1, 0.3],
    build({ addEdgeLines }) {
      const group = new THREE.Group();

      // Triangular air intake opening
      const shape = new THREE.Shape();
      shape.moveTo(-0.07, 0);
      shape.lineTo(0.07, 0);
      shape.lineTo(0.04, 0.2);
      shape.quadraticCurveTo(0, 0.27, -0.04, 0.2);
      shape.lineTo(-0.07, 0);

      const extrudeSettings = {
        depth: 0.2,
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

      // Support pillar connecting to monocoque
      const pillarGeo = new THREE.BoxGeometry(0.06, 0.2, 0.12);
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
    assembledPosition: [0, 0.47, -0.5],
    assembledRotation: [0, 0, 0],
    explosionDirection: [0, 0.8, -0.5],
    build({ addEdgeLines }) {
      // Elongated oval ring for cockpit opening
      const outerShape = new THREE.Shape();
      outerShape.absellipse(0, 0, 0.22, 0.35, 0, Math.PI * 2, false, 0);
      const innerHole = new THREE.Path();
      innerHole.absellipse(0, 0, 0.17, 0.30, 0, Math.PI * 2, false, 0);
      outerShape.holes.push(innerHole);

      const extrudeSettings = {
        depth: 0.06,
        bevelEnabled: true,
        bevelThickness: 0.01,
        bevelSize: 0.01,
        bevelSegments: 2,
      };
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
