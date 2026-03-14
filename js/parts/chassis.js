// ============================================================
//  Chassis parts — survival cell, halo, floor, crash structures
//  Color: #F4A261 (warm amber)
//  SOLID, THICK geometry — no skeletal wireframes
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
    opacity: 0.96,
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
    assembledPosition: [0, 0.15, -0.05],
    assembledRotation: [0, 0, 0],
    explosionDirection: [0, 1, 0],
    build({ addEdgeLines }) {
      const group = new THREE.Group();

      // === MAIN TUB — thick solid body ===
      // Build from multiple box/cylinder primitives for a chunky solid look
      // Base box: the main structural tub
      const tubW = 0.60, tubH = 0.38, tubL = 2.5;
      const tubGeo = new THREE.BoxGeometry(tubW, tubH, tubL, 1, 1, 1);
      // Slightly taper the top vertices inward for a wedge shape
      const pos = tubGeo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const y = pos.getY(i);
        const z = pos.getZ(i);
        if (y > 0) {
          // Taper top inward by ~15%
          const xOld = pos.getX(i);
          pos.setX(i, xOld * 0.82);
        }
        // Taper the rear slightly narrower
        if (z > 0.5) {
          const factor = 1.0 - (z - 0.5) * 0.08;
          pos.setX(i, pos.getX(i) * factor);
        }
        // Taper the front slightly narrower
        if (z < -0.8) {
          const factor = 1.0 - (-0.8 - z) * 0.12;
          pos.setX(i, pos.getX(i) * Math.max(factor, 0.65));
        }
      }
      pos.needsUpdate = true;
      tubGeo.computeVertexNormals();

      const tub = new THREE.Mesh(tubGeo, mat());
      tub.castShadow = true;
      tub.receiveShadow = true;
      addEdgeLines(tub);
      group.add(tub);

      // === COCKPIT RIM — raised lip around the cockpit opening ===
      // Thick oval ring from Z=-0.8 to Z=-0.1
      const rimOuterW = 0.28, rimOuterL = 0.40;
      const rimInnerW = 0.21, rimInnerL = 0.32;
      const rimH = 0.10;
      const rimShape = new THREE.Shape();
      rimShape.absellipse(0, 0, rimOuterW, rimOuterL, 0, Math.PI * 2, false, 0);
      const rimHole = new THREE.Path();
      rimHole.absellipse(0, 0, rimInnerW, rimInnerL, 0, Math.PI * 2, false, 0);
      rimShape.holes.push(rimHole);

      const rimGeo = new THREE.ExtrudeGeometry(rimShape, {
        depth: rimH,
        bevelEnabled: true,
        bevelThickness: 0.015,
        bevelSize: 0.015,
        bevelSegments: 3,
      });
      rimGeo.rotateX(-Math.PI / 2);
      rimGeo.center();
      const rim = new THREE.Mesh(rimGeo, mat({ opacity: 0.97 }));
      rim.position.set(0, tubH / 2 + rimH / 2 - 0.01, -0.45);
      rim.castShadow = true;
      rim.receiveShadow = true;
      addEdgeLines(rim);
      group.add(rim);

      // === TOP RIDGE LINE — subtle raised spine along the top ===
      const ridgeGeo = new THREE.BoxGeometry(0.06, 0.04, 1.8);
      const ridge = new THREE.Mesh(ridgeGeo, mat({ opacity: 0.94 }));
      ridge.position.set(0, tubH / 2 + 0.01, 0.25);
      ridge.castShadow = true;
      addEdgeLines(ridge);
      group.add(ridge);

      // === ENGINE COVER — thick curved shell from cockpit to rear ===
      // Covers Z=0.2 to Z=1.5, overlapping monocoque
      const coverShape = new THREE.Shape();
      // Cross-section: wide at base, rounded dome on top
      coverShape.moveTo(-0.28, 0);
      coverShape.lineTo(0.28, 0);
      coverShape.lineTo(0.24, 0.12);
      coverShape.quadraticCurveTo(0.20, 0.24, 0.12, 0.28);
      coverShape.quadraticCurveTo(0, 0.32, -0.12, 0.28);
      coverShape.quadraticCurveTo(-0.20, 0.24, -0.24, 0.12);
      coverShape.lineTo(-0.28, 0);

      // Extrude along a tapering path
      const coverPath = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0.02, 0.3),
        new THREE.Vector3(0, 0.0, 0.7),
        new THREE.Vector3(0, -0.04, 1.1),
        new THREE.Vector3(0, -0.08, 1.4),
      ]);
      const coverGeo = new THREE.ExtrudeGeometry(coverShape, {
        steps: 40,
        extrudePath: coverPath,
        bevelEnabled: false,
      });
      const cover = new THREE.Mesh(coverGeo, mat({ opacity: 0.95 }));
      cover.position.set(0, tubH / 2 - 0.02, 0.15);
      cover.castShadow = true;
      cover.receiveShadow = true;
      addEdgeLines(cover);
      group.add(cover);

      // === NOSE CONE — long solid tapered cone extending from monocoque ===
      // From Z=-1.25 forward to Z=-2.5, solid and aerodynamic
      // Build from multiple cylinder segments for a solid tapered look
      const noseSegments = 12;
      const noseStartZ = 0;
      const noseEndZ = -1.3;
      const noseStartW = 0.18; // half-width matching monocoque front
      const noseEndW = 0.04;  // narrow tip

      for (let i = 0; i < noseSegments; i++) {
        const t0 = i / noseSegments;
        const t1 = (i + 1) / noseSegments;
        const z0 = noseStartZ + t0 * (noseEndZ - noseStartZ);
        const z1 = noseStartZ + t1 * (noseEndZ - noseStartZ);
        const r0 = noseStartW + t0 * (noseEndW - noseStartW);
        const r1 = noseStartW + t1 * (noseEndW - noseStartW);
        const segLen = Math.abs(z1 - z0);

        // Use an elliptic cross section (wider than tall)
        const segGeo = new THREE.CylinderGeometry(r1, r0, segLen, 12, 1);
        segGeo.rotateX(Math.PI / 2);
        // Scale Y to make it flatter (more aero)
        segGeo.scale(1.0, 0.7, 1.0);

        const seg = new THREE.Mesh(segGeo, mat());
        seg.position.set(0, 0.02, (z0 + z1) / 2 - 1.25);
        // Lower it gradually toward the tip
        seg.position.y -= t0 * 0.04;
        seg.castShadow = true;
        seg.receiveShadow = true;
        if (i % 3 === 0) addEdgeLines(seg);
        group.add(seg);
      }

      // Nose tip cap — solid sphere
      const tipGeo = new THREE.SphereGeometry(0.04, 12, 8);
      tipGeo.scale(1.0, 0.7, 1.2);
      const tip = new THREE.Mesh(tipGeo, mat());
      tip.position.set(0, -0.02, -2.55);
      tip.castShadow = true;
      addEdgeLines(tip);
      group.add(tip);

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
      // Main hoop curve — thicker tube (0.028 radius)
      const pts = [
        new THREE.Vector3(0, 0, 0.3),
        new THREE.Vector3(-0.18, 0.13, 0.1),
        new THREE.Vector3(-0.20, 0.20, -0.15),
        new THREE.Vector3(-0.14, 0.18, -0.4),
        new THREE.Vector3(0, 0.16, -0.52),
        new THREE.Vector3(0.14, 0.18, -0.4),
        new THREE.Vector3(0.20, 0.20, -0.15),
        new THREE.Vector3(0.18, 0.13, 0.1),
        new THREE.Vector3(0, 0, 0.3),
      ];
      const curve = new THREE.CatmullRomCurve3(pts, false);
      const tubeGeo = new THREE.TubeGeometry(curve, 64, 0.028, 14, false);
      const mesh = new THREE.Mesh(tubeGeo, mat({ metalness: 0.6, roughness: 0.25 }));
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      addEdgeLines(mesh);

      // Central strut — thicker
      const strutPts = [
        new THREE.Vector3(0, 0.16, -0.52),
        new THREE.Vector3(0, 0.04, -0.57),
        new THREE.Vector3(0, -0.08, -0.52),
      ];
      const strutCurve = new THREE.CatmullRomCurve3(strutPts);
      const strutGeo = new THREE.TubeGeometry(strutCurve, 12, 0.024, 10, false);
      const strut = new THREE.Mesh(strutGeo, mat({ metalness: 0.6, roughness: 0.25 }));
      strut.castShadow = true;
      strut.receiveShadow = true;

      // Side braces for added solidity
      const braceL = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.18, 0.13, 0.1),
        new THREE.Vector3(-0.10, 0.02, 0.05),
      ]);
      const braceLGeo = new THREE.TubeGeometry(braceL, 8, 0.018, 8, false);
      const braceLMesh = new THREE.Mesh(braceLGeo, mat({ metalness: 0.6, roughness: 0.25 }));
      braceLMesh.castShadow = true;

      const braceR = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.18, 0.13, 0.1),
        new THREE.Vector3(0.10, 0.02, 0.05),
      ]);
      const braceRGeo = new THREE.TubeGeometry(braceR, 8, 0.018, 8, false);
      const braceRMesh = new THREE.Mesh(braceRGeo, mat({ metalness: 0.6, roughness: 0.25 }));
      braceRMesh.castShadow = true;

      group.add(mesh, strut, braceLMesh, braceRMesh);
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
      // THICK floor — 0.04 depth, wide and solid
      const shape = new THREE.Shape();
      shape.moveTo(-0.38, -1.5);
      shape.lineTo(0.38, -1.5);
      shape.lineTo(0.68, -0.8);
      shape.lineTo(0.88, -0.3);
      shape.lineTo(0.88, 1.2);
      shape.lineTo(0.72, 1.8);
      shape.lineTo(0.52, 2.2);
      shape.lineTo(-0.52, 2.2);
      shape.lineTo(-0.72, 1.8);
      shape.lineTo(-0.88, 1.2);
      shape.lineTo(-0.88, -0.3);
      shape.lineTo(-0.68, -0.8);
      shape.lineTo(-0.38, -1.5);

      const extrudeSettings = {
        depth: 0.04,
        bevelEnabled: true,
        bevelThickness: 0.005,
        bevelSize: 0.005,
        bevelSegments: 1,
      };
      const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      geo.rotateX(-Math.PI / 2);
      geo.computeBoundingBox();
      geo.center();
      const mesh = new THREE.Mesh(geo, mat({ opacity: 0.96 }));
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
      // Thicker, more solid diffuser channels
      const channelCount = 7;
      const totalWidth = 1.1;
      const channelWidth = totalWidth / channelCount;

      for (let i = 0; i < channelCount; i++) {
        // Thicker channel walls
        const shape = new THREE.Shape();
        shape.moveTo(0, 0);
        shape.lineTo(channelWidth * 0.82, 0);
        shape.lineTo(channelWidth * 0.82, 0.025);
        shape.lineTo(0, 0.025);
        shape.lineTo(0, 0);

        const path = new THREE.CatmullRomCurve3([
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(0, 0.05, 0.15),
          new THREE.Vector3(0, 0.14, 0.35),
          new THREE.Vector3(0, 0.24, 0.5),
        ]);
        const extrudeSettings = {
          steps: 24,
          extrudePath: path,
          bevelEnabled: false,
        };
        const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        const mesh = new THREE.Mesh(geo, mat());
        mesh.position.x = -totalWidth / 2 + i * channelWidth + channelWidth * 0.09;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        addEdgeLines(mesh);
        group.add(mesh);
      }

      // Diffuser outer shell / shroud for solidity
      const shroudShape = new THREE.Shape();
      shroudShape.moveTo(-totalWidth / 2 - 0.02, 0);
      shroudShape.lineTo(totalWidth / 2 + 0.02, 0);
      shroudShape.lineTo(totalWidth / 2 + 0.02, 0.02);
      shroudShape.lineTo(-totalWidth / 2 - 0.02, 0.02);
      shroudShape.closePath();

      const shroudPath = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0.05, 0.15),
        new THREE.Vector3(0, 0.14, 0.35),
        new THREE.Vector3(0, 0.24, 0.52),
      ]);
      const shroudGeo = new THREE.ExtrudeGeometry(shroudShape, {
        steps: 24,
        extrudePath: shroudPath,
        bevelEnabled: false,
      });
      const shroud = new THREE.Mesh(shroudGeo, mat({ opacity: 0.90 }));
      shroud.castShadow = true;
      addEdgeLines(shroud);
      group.add(shroud);

      return group;
    },
  },

  // ---- Front Crash Structure --------------------------------
  {
    id: 'frontCrashStructure',
    name: 'Front Crash Structure',
    group: GROUP,
    description: 'Deformable impact-absorbing nose cone structure designed to crumple progressively on impact.',
    assembledPosition: [0, 0.10, -2.25],
    assembledRotation: [0, 0, 0],
    explosionDirection: [0, 0, -1],
    build({ addEdgeLines }) {
      const group = new THREE.Group();

      // Thick solid crash structure — internal honeycomb suggestion
      // Main body: box that tapers forward
      const bodyGeo = new THREE.BoxGeometry(0.22, 0.16, 0.45);
      // Taper the front vertices
      const bpos = bodyGeo.attributes.position;
      for (let i = 0; i < bpos.count; i++) {
        const z = bpos.getZ(i);
        if (z < 0) {
          // Front face — taper inward
          bpos.setX(i, bpos.getX(i) * 0.55);
          bpos.setY(i, bpos.getY(i) * 0.65);
        }
      }
      bpos.needsUpdate = true;
      bodyGeo.computeVertexNormals();

      const body = new THREE.Mesh(bodyGeo, mat());
      body.castShadow = true;
      body.receiveShadow = true;
      addEdgeLines(body);
      group.add(body);

      // Nose tip cap — rounded
      const tipGeo = new THREE.SphereGeometry(0.06, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2);
      tipGeo.rotateX(Math.PI / 2);
      tipGeo.scale(1.0, 0.7, 1.0);
      const tip = new THREE.Mesh(tipGeo, mat());
      tip.position.set(0, 0, -0.22);
      tip.castShadow = true;
      addEdgeLines(tip);
      group.add(tip);

      // Wing pylons connecting nose to front wing area
      const pylonGeoL = new THREE.BoxGeometry(0.03, 0.06, 0.3);
      const pylonL = new THREE.Mesh(pylonGeoL, mat());
      pylonL.position.set(-0.06, -0.08, -0.1);
      pylonL.castShadow = true;
      group.add(pylonL);

      const pylonGeoR = new THREE.BoxGeometry(0.03, 0.06, 0.3);
      const pylonR = new THREE.Mesh(pylonGeoR, mat());
      pylonR.position.set(0.06, -0.08, -0.1);
      pylonR.castShadow = true;
      group.add(pylonR);

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

      // Bigger, chunkier rear crash structure
      const geo = new THREE.BoxGeometry(0.18, 0.14, 0.28);
      // Taper rear face
      const bpos = geo.attributes.position;
      for (let i = 0; i < bpos.count; i++) {
        const z = bpos.getZ(i);
        if (z > 0) {
          bpos.setX(i, bpos.getX(i) * 0.7);
          bpos.setY(i, bpos.getY(i) * 0.75);
        }
      }
      bpos.needsUpdate = true;
      geo.computeVertexNormals();

      const box = new THREE.Mesh(geo, mat());
      box.castShadow = true;
      box.receiveShadow = true;
      addEdgeLines(box);

      // Tapered rear cap — bigger
      const capGeo = new THREE.CylinderGeometry(0.06, 0.045, 0.1, 10);
      capGeo.rotateX(Math.PI / 2);
      const cap = new THREE.Mesh(capGeo, mat());
      cap.position.z = 0.18;
      cap.castShadow = true;
      cap.receiveShadow = true;
      addEdgeLines(cap);

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
    assembledPosition: [0, 0.68, -0.1],
    assembledRotation: [0, 0, 0],
    explosionDirection: [0, 1, 0.3],
    build({ addEdgeLines }) {
      const group = new THREE.Group();

      // Taller, more prominent airbox intake
      const shape = new THREE.Shape();
      shape.moveTo(-0.09, 0);
      shape.lineTo(0.09, 0);
      shape.lineTo(0.06, 0.28);
      shape.quadraticCurveTo(0, 0.36, -0.06, 0.28);
      shape.lineTo(-0.09, 0);

      const extrudeSettings = {
        depth: 0.24,
        bevelEnabled: true,
        bevelThickness: 0.015,
        bevelSize: 0.015,
        bevelSegments: 3,
      };
      const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      geo.center();
      const mesh = new THREE.Mesh(geo, mat());
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      addEdgeLines(mesh);

      // Thicker support pillar
      const pillarGeo = new THREE.BoxGeometry(0.08, 0.24, 0.16);
      const pillar = new THREE.Mesh(pillarGeo, mat());
      pillar.position.y = -0.24;
      pillar.castShadow = true;
      pillar.receiveShadow = true;
      addEdgeLines(pillar);

      // Side fairings connecting to body
      const fairGeoL = new THREE.BoxGeometry(0.04, 0.12, 0.14);
      const fairL = new THREE.Mesh(fairGeoL, mat({ opacity: 0.93 }));
      fairL.position.set(-0.06, -0.16, 0);
      fairL.castShadow = true;

      const fairGeoR = new THREE.BoxGeometry(0.04, 0.12, 0.14);
      const fairR = new THREE.Mesh(fairGeoR, mat({ opacity: 0.93 }));
      fairR.position.set(0.06, -0.16, 0);
      fairR.castShadow = true;

      group.add(mesh, pillar, fairL, fairR);
      return group;
    },
  },

  // ---- Cockpit Surround ------------------------------------
  {
    id: 'cockpitSurround',
    name: 'Cockpit Surround',
    group: GROUP,
    description: 'Raised cockpit lip and surround forming the opening where the driver sits.',
    assembledPosition: [0, 0.47, -0.45],
    assembledRotation: [0, 0, 0],
    explosionDirection: [0, 0.8, -0.5],
    build({ addEdgeLines }) {
      const group = new THREE.Group();

      // Thicker cockpit surround ring
      const outerShape = new THREE.Shape();
      outerShape.absellipse(0, 0, 0.24, 0.38, 0, Math.PI * 2, false, 0);
      const innerHole = new THREE.Path();
      innerHole.absellipse(0, 0, 0.18, 0.31, 0, Math.PI * 2, false, 0);
      outerShape.holes.push(innerHole);

      const extrudeSettings = {
        depth: 0.09,
        bevelEnabled: true,
        bevelThickness: 0.015,
        bevelSize: 0.015,
        bevelSegments: 3,
      };
      const geo = new THREE.ExtrudeGeometry(outerShape, extrudeSettings);
      geo.rotateX(-Math.PI / 2);
      geo.center();
      const mesh = new THREE.Mesh(geo, mat());
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      addEdgeLines(mesh);
      group.add(mesh);

      // Headrest / padding behind cockpit
      const headrestGeo = new THREE.BoxGeometry(0.14, 0.10, 0.12);
      const headrest = new THREE.Mesh(headrestGeo, mat({ opacity: 0.94 }));
      headrest.position.set(0, 0.02, 0.28);
      headrest.castShadow = true;
      addEdgeLines(headrest);
      group.add(headrest);

      return group;
    },
  },
];
