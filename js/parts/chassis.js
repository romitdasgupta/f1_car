// ============================================================
//  Chassis parts — survival cell, halo, floor, crash structures
//  Color: #F4A261 (warm amber)
//  HIGH-POLY vertex-deformed geometry for organic F1 shapes
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

/** Attempt to smooth a transition: returns 0 at edge0, 1 at edge1 */
function smoothstep(edge0, edge1, x) {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/** Attempt to lerp between a and b by t */
function lerp(a, b, t) {
  return a + (b - a) * t;
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
      const PI = Math.PI;

      // === MAIN TUB — high-poly deformed box for organic monocoque ===
      const tubW = 0.58, tubH = 0.34, tubL = 3.0;
      const tubGeo = new THREE.BoxGeometry(tubW, tubH, tubL, 8, 6, 24);
      const pos = tubGeo.attributes.position;
      const halfW = tubW / 2;
      const halfH = tubH / 2;
      const halfL = tubL / 2;

      for (let i = 0; i < pos.count; i++) {
        let x = pos.getX(i);
        let y = pos.getY(i);
        let z = pos.getZ(i);

        // Normalize coordinates
        const xNorm = x / halfW; // -1..1
        const yNorm = y / halfH; // -1..1
        const zNorm = z / halfL; // -1..1

        // --- Width tapering ---
        // Front taper: from z=0 (zNorm ~ 0) forward to nose tip
        // z=-1.5 is the front of the tub (zNorm = -1)
        if (zNorm < 0) {
          // Smooth parabolic taper: width goes from 1.0 at z=0 to 0.21 at z=-1.5
          const t = -zNorm; // 0..1
          const taperCurve = 1.0 - 0.79 * Math.pow(t, 1.4);
          x *= Math.max(taperCurve, 0.21);
        }

        // Rear coke-bottle taper: from z=0 rearward
        if (zNorm > 0) {
          const t = zNorm; // 0..1
          const rearTaper = 1.0 - 0.31 * smoothstep(0.0, 1.0, t);
          x *= rearTaper;
        }

        // --- Height tapering (wedge shape at front) ---
        if (zNorm < -0.1) {
          const t = smoothstep(-0.1, -1.0, zNorm);
          // Reduce height at front: 0.34 down to 0.18
          const heightScale = lerp(1.0, 0.53, t);
          y *= heightScale;
          // Lower the front slightly (droop)
          y -= t * 0.02;
        }

        // --- Top surface dome ---
        if (yNorm > 0) {
          const distFromCenterX = Math.abs(x / (halfW * 0.5));
          const domeAmount = Math.max(0, 1.0 - distFromCenterX * distFromCenterX) * 0.025;
          y += domeAmount;
        }

        // --- Round the cross-section corners ---
        // Apply sin/cos rounding to make box corners organic
        const cornerRadius = 0.15; // fraction of half-dimensions to round
        const absXnorm = Math.abs(xNorm);
        const absYnorm = Math.abs(yNorm);
        if (absXnorm > (1.0 - cornerRadius) && absYnorm > (1.0 - cornerRadius)) {
          const cx = (1.0 - cornerRadius);
          const cy = (1.0 - cornerRadius);
          const dx = absXnorm - cx;
          const dy = absYnorm - cy;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > cornerRadius) {
            const scale = cornerRadius / dist;
            const newAbsX = cx + dx * scale;
            const newAbsY = cy + dy * scale;
            x = Math.sign(x) * newAbsX * halfW * Math.abs(x / (absXnorm * halfW || 1));
            y = Math.sign(y) * newAbsY * halfH * Math.abs(y / (absYnorm * halfH || 1));
          }
        }

        // Additional top-edge rounding
        if (yNorm > 0.7) {
          const t = (yNorm - 0.7) / 0.3;
          const inset = t * t * 0.08;
          x *= (1.0 - inset);
        }

        pos.setX(i, x);
        pos.setY(i, y);
        pos.setZ(i, z);
      }
      pos.needsUpdate = true;
      tubGeo.computeVertexNormals();

      const tub = new THREE.Mesh(tubGeo, mat());
      tub.castShadow = true;
      tub.receiveShadow = true;
      addEdgeLines(tub);
      group.add(tub);

      // === COCKPIT RIM — raised oval lip at z ~ -0.45 ===
      const rimOuterW = 0.24, rimOuterL = 0.36;
      const rimInnerW = 0.18, rimInnerL = 0.29;
      const rimH = 0.10;
      const rimShape = new THREE.Shape();
      rimShape.absellipse(0, 0, rimOuterW, rimOuterL, 0, PI * 2, false, 0);
      const rimHole = new THREE.Path();
      rimHole.absellipse(0, 0, rimInnerW, rimInnerL, 0, PI * 2, false, 0);
      rimShape.holes.push(rimHole);

      const rimGeo = new THREE.ExtrudeGeometry(rimShape, {
        depth: rimH,
        bevelEnabled: true,
        bevelThickness: 0.012,
        bevelSize: 0.012,
        bevelSegments: 4,
      });
      rimGeo.rotateX(-PI / 2);
      rimGeo.center();
      const rim = new THREE.Mesh(rimGeo, mat({ opacity: 0.97 }));
      rim.position.set(0, tubH / 2 + rimH / 2 - 0.01, -0.45);
      rim.castShadow = true;
      rim.receiveShadow = true;
      addEdgeLines(rim);
      group.add(rim);

      // === ENGINE COVER — extruded dome along a CatmullRomCurve3 ===
      // Cross-section: smooth dome shape
      const coverShape = new THREE.Shape();
      const coverSegments = 24;
      // Build a smooth dome cross-section
      coverShape.moveTo(-0.14, 0);
      for (let i = 0; i <= coverSegments; i++) {
        const t = i / coverSegments;
        const angle = t * PI;
        const cx = -0.14 + t * 0.28; // -0.14 to 0.14
        const cy = Math.sin(angle) * 0.22;
        coverShape.lineTo(cx, cy);
      }
      coverShape.lineTo(-0.14, 0);

      const coverPath = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0.02, 0.25),
        new THREE.Vector3(0, 0.01, 0.55),
        new THREE.Vector3(0, -0.02, 0.85),
        new THREE.Vector3(0, -0.06, 1.15),
        new THREE.Vector3(0, -0.10, 1.40),
      ]);
      const coverGeo = new THREE.ExtrudeGeometry(coverShape, {
        steps: 48,
        extrudePath: coverPath,
        bevelEnabled: false,
      });

      // Taper the engine cover: narrow toward the rear
      const coverPos = coverGeo.attributes.position;
      for (let i = 0; i < coverPos.count; i++) {
        const cz = coverPos.getZ(i);
        // As z increases (toward rear), narrow both x and y
        if (cz > 0.3) {
          const t = smoothstep(0.3, 1.4, cz);
          const taper = lerp(1.0, 0.55, t);
          coverPos.setX(i, coverPos.getX(i) * taper);
          coverPos.setY(i, coverPos.getY(i) * lerp(1.0, 0.50, t));
        }
      }
      coverPos.needsUpdate = true;
      coverGeo.computeVertexNormals();

      const cover = new THREE.Mesh(coverGeo, mat({ opacity: 0.95 }));
      cover.position.set(0, tubH / 2 - 0.02, 0.10);
      cover.castShadow = true;
      cover.receiveShadow = true;
      addEdgeLines(cover);
      group.add(cover);

      // === NOSE CONE — single high-poly box with parabolic taper ===
      const noseW = 0.24, noseH = 0.16, noseL = 1.4;
      const noseGeo = new THREE.BoxGeometry(noseW, noseH, noseL, 6, 4, 14);
      const npos = noseGeo.attributes.position;
      const nHalfW = noseW / 2;
      const nHalfH = noseH / 2;
      const nHalfL = noseL / 2;

      for (let i = 0; i < npos.count; i++) {
        let nx = npos.getX(i);
        let ny = npos.getY(i);
        let nz = npos.getZ(i);

        const nxNorm = nx / nHalfW;
        const nyNorm = ny / nHalfH;
        // z ranges from -nHalfL (tip) to +nHalfL (base connecting to monocoque)
        // t=0 at base, t=1 at tip
        const t = Math.max(0, (-nz + nHalfL) / noseL); // 0 at z=+halfL, 1 at z=-halfL

        // Parabolic width taper: 0.24 at base to 0.06 at tip
        const widthTaper = lerp(1.0, 0.25, Math.pow(t, 1.3));
        nx *= widthTaper;

        // Height taper: 0.16 at base to 0.06 at tip
        const heightTaper = lerp(1.0, 0.375, Math.pow(t, 1.2));
        ny *= heightTaper;

        // Droop: lower front vertices by 0.03
        ny -= t * 0.03;

        // Round cross-section corners using sin/cos
        const absXn = Math.abs(nxNorm);
        const absYn = Math.abs(nyNorm);
        if (absXn > 0.6 && absYn > 0.6) {
          const r = 0.35;
          const cx = 1.0 - r;
          const cy = 1.0 - r;
          const dx = Math.max(0, absXn - cx);
          const dy = Math.max(0, absYn - cy);
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > r) {
            const scale = r / dist;
            nx *= (cx + dx * scale) / absXn;
            ny = Math.sign(ny) * Math.abs(ny) * ((cy + dy * scale) / absYn);
          }
        }

        npos.setX(i, nx);
        npos.setY(i, ny);
        npos.setZ(i, nz);
      }
      npos.needsUpdate = true;
      noseGeo.computeVertexNormals();

      const nose = new THREE.Mesh(noseGeo, mat());
      nose.position.set(0, 0.10, -1.75);
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
      // Main hoop curve — thicker tube (0.030 radius)
      const pts = [
        new THREE.Vector3(0, 0, 0.3),
        new THREE.Vector3(-0.18, 0.12, 0.15),
        new THREE.Vector3(-0.21, 0.20, -0.10),
        new THREE.Vector3(-0.18, 0.22, -0.32),
        new THREE.Vector3(-0.12, 0.19, -0.48),
        new THREE.Vector3(0, 0.17, -0.55),
        new THREE.Vector3(0.12, 0.19, -0.48),
        new THREE.Vector3(0.18, 0.22, -0.32),
        new THREE.Vector3(0.21, 0.20, -0.10),
        new THREE.Vector3(0.18, 0.12, 0.15),
        new THREE.Vector3(0, 0, 0.3),
      ];
      const curve = new THREE.CatmullRomCurve3(pts, false);
      const tubeGeo = new THREE.TubeGeometry(curve, 72, 0.030, 16, false);
      const mesh = new THREE.Mesh(tubeGeo, mat({ metalness: 0.6, roughness: 0.25 }));
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      addEdgeLines(mesh);

      // Central strut — thicker
      const strutPts = [
        new THREE.Vector3(0, 0.17, -0.55),
        new THREE.Vector3(0, 0.05, -0.60),
        new THREE.Vector3(0, -0.07, -0.52),
      ];
      const strutCurve = new THREE.CatmullRomCurve3(strutPts);
      const strutGeo = new THREE.TubeGeometry(strutCurve, 14, 0.026, 12, false);
      const strut = new THREE.Mesh(strutGeo, mat({ metalness: 0.6, roughness: 0.25 }));
      strut.castShadow = true;
      strut.receiveShadow = true;

      // Side braces
      const braceL = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.18, 0.12, 0.15),
        new THREE.Vector3(-0.10, 0.02, 0.08),
      ]);
      const braceLGeo = new THREE.TubeGeometry(braceL, 8, 0.020, 10, false);
      const braceLMesh = new THREE.Mesh(braceLGeo, mat({ metalness: 0.6, roughness: 0.25 }));
      braceLMesh.castShadow = true;

      const braceR = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.18, 0.12, 0.15),
        new THREE.Vector3(0.10, 0.02, 0.08),
      ]);
      const braceRGeo = new THREE.TubeGeometry(braceR, 8, 0.020, 10, false);
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
      // Smooth car-profile floor with curves instead of straight edges
      const shape = new THREE.Shape();
      // Start at front center-ish, go clockwise
      shape.moveTo(-0.25, -1.5);
      // Front left curving outward
      shape.quadraticCurveTo(-0.32, -1.3, -0.45, -1.0);
      shape.quadraticCurveTo(-0.65, -0.6, -0.85, -0.2);
      // Left side
      shape.lineTo(-0.88, 0.4);
      shape.lineTo(-0.88, 1.0);
      // Rear left tapering
      shape.quadraticCurveTo(-0.82, 1.5, -0.68, 1.8);
      shape.quadraticCurveTo(-0.58, 2.0, -0.48, 2.2);
      // Rear edge
      shape.lineTo(0.48, 2.2);
      // Rear right tapering
      shape.quadraticCurveTo(0.58, 2.0, 0.68, 1.8);
      shape.quadraticCurveTo(0.82, 1.5, 0.88, 1.0);
      // Right side
      shape.lineTo(0.88, 0.4);
      shape.lineTo(0.85, -0.2);
      // Front right curving inward
      shape.quadraticCurveTo(0.65, -0.6, 0.45, -1.0);
      shape.quadraticCurveTo(0.32, -1.3, 0.25, -1.5);
      shape.closePath();

      const extrudeSettings = {
        depth: 0.04,
        bevelEnabled: true,
        bevelThickness: 0.005,
        bevelSize: 0.005,
        bevelSegments: 2,
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
      const channelCount = 7;
      const totalWidth = 1.1;
      const channelWidth = totalWidth / channelCount;

      for (let i = 0; i < channelCount; i++) {
        const shape = new THREE.Shape();
        shape.moveTo(0, 0);
        shape.lineTo(channelWidth * 0.82, 0);
        shape.lineTo(channelWidth * 0.82, 0.025);
        shape.lineTo(0, 0.025);
        shape.lineTo(0, 0);

        const path = new THREE.CatmullRomCurve3([
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(0, 0.04, 0.12),
          new THREE.Vector3(0, 0.12, 0.30),
          new THREE.Vector3(0, 0.22, 0.48),
        ]);
        const geo = new THREE.ExtrudeGeometry(shape, {
          steps: 24,
          extrudePath: path,
          bevelEnabled: false,
        });
        const mesh = new THREE.Mesh(geo, mat());
        mesh.position.x = -totalWidth / 2 + i * channelWidth + channelWidth * 0.09;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        addEdgeLines(mesh);
        group.add(mesh);
      }

      // Outer shroud
      const shroudShape = new THREE.Shape();
      shroudShape.moveTo(-totalWidth / 2 - 0.02, 0);
      shroudShape.lineTo(totalWidth / 2 + 0.02, 0);
      shroudShape.lineTo(totalWidth / 2 + 0.02, 0.02);
      shroudShape.lineTo(-totalWidth / 2 - 0.02, 0.02);
      shroudShape.closePath();

      const shroudPath = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0.04, 0.12),
        new THREE.Vector3(0, 0.12, 0.30),
        new THREE.Vector3(0, 0.22, 0.50),
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

      // Smooth tapered crash structure using high-poly box
      const csW = 0.22, csH = 0.16, csL = 0.50;
      const csGeo = new THREE.BoxGeometry(csW, csH, csL, 4, 3, 8);
      const bpos = csGeo.attributes.position;
      const csHalfL = csL / 2;

      for (let i = 0; i < bpos.count; i++) {
        let x = bpos.getX(i);
        let y = bpos.getY(i);
        const z = bpos.getZ(i);

        // Smooth taper toward front (z < 0)
        const t = smoothstep(0, -csHalfL, z); // 0 at rear, 1 at front
        const taper = lerp(1.0, 0.30, Math.pow(t, 0.8));
        x *= taper;
        y *= lerp(1.0, 0.45, Math.pow(t, 0.8));

        // Round cross-section
        const xn = Math.abs(x) / (csW / 2);
        const yn = Math.abs(y) / (csH / 2);
        if (xn > 0.7 && yn > 0.7) {
          const cornerScale = 0.92;
          x *= cornerScale;
          y *= cornerScale;
        }

        bpos.setX(i, x);
        bpos.setY(i, y);
      }
      bpos.needsUpdate = true;
      csGeo.computeVertexNormals();

      const body = new THREE.Mesh(csGeo, mat());
      body.castShadow = true;
      body.receiveShadow = true;
      addEdgeLines(body);
      group.add(body);

      // Rounded nose tip
      const tipGeo = new THREE.SphereGeometry(0.035, 14, 10);
      tipGeo.scale(1.0, 0.7, 1.3);
      const tip = new THREE.Mesh(tipGeo, mat());
      tip.position.set(0, 0, -csHalfL);
      tip.castShadow = true;
      addEdgeLines(tip);
      group.add(tip);

      // Wing pylons
      const pylonGeoL = new THREE.BoxGeometry(0.025, 0.05, 0.25);
      const pylonL = new THREE.Mesh(pylonGeoL, mat());
      pylonL.position.set(-0.05, -0.07, -0.05);
      pylonL.castShadow = true;
      group.add(pylonL);

      const pylonGeoR = new THREE.BoxGeometry(0.025, 0.05, 0.25);
      const pylonR = new THREE.Mesh(pylonGeoR, mat());
      pylonR.position.set(0.05, -0.07, -0.05);
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

      const geo = new THREE.BoxGeometry(0.18, 0.14, 0.28, 3, 2, 4);
      const bpos = geo.attributes.position;
      for (let i = 0; i < bpos.count; i++) {
        const z = bpos.getZ(i);
        if (z > 0) {
          const t = z / 0.14;
          bpos.setX(i, bpos.getX(i) * lerp(1.0, 0.65, t));
          bpos.setY(i, bpos.getY(i) * lerp(1.0, 0.70, t));
        }
        // Round corners
        const xn = Math.abs(bpos.getX(i)) / 0.09;
        const yn = Math.abs(bpos.getY(i)) / 0.07;
        if (xn > 0.8 && yn > 0.8) {
          bpos.setX(i, bpos.getX(i) * 0.93);
          bpos.setY(i, bpos.getY(i) * 0.93);
        }
      }
      bpos.needsUpdate = true;
      geo.computeVertexNormals();

      const box = new THREE.Mesh(geo, mat());
      box.castShadow = true;
      box.receiveShadow = true;
      addEdgeLines(box);

      const capGeo = new THREE.CylinderGeometry(0.055, 0.040, 0.10, 12);
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

      // Triangular airbox intake shape (like Mercedes W14)
      const shape = new THREE.Shape();
      // Wider at base, narrowing to a peak — tall and triangular
      shape.moveTo(-0.10, 0);
      shape.lineTo(0.10, 0);
      // Right side curves up and inward
      shape.quadraticCurveTo(0.08, 0.18, 0.04, 0.34);
      // Peak — narrow top
      shape.quadraticCurveTo(0.02, 0.40, 0, 0.42);
      shape.quadraticCurveTo(-0.02, 0.40, -0.04, 0.34);
      // Left side
      shape.quadraticCurveTo(-0.08, 0.18, -0.10, 0);

      const extrudeSettings = {
        depth: 0.22,
        bevelEnabled: true,
        bevelThickness: 0.012,
        bevelSize: 0.012,
        bevelSegments: 4,
      };
      const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      geo.center();
      const mesh = new THREE.Mesh(geo, mat());
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      addEdgeLines(mesh);

      // Thicker support pillar tapering upward
      const pillarGeo = new THREE.BoxGeometry(0.08, 0.28, 0.14, 2, 3, 2);
      const ppos = pillarGeo.attributes.position;
      for (let i = 0; i < ppos.count; i++) {
        const y = ppos.getY(i);
        if (y > 0) {
          // Taper pillar toward top
          const t = y / 0.14;
          ppos.setX(i, ppos.getX(i) * lerp(1.0, 0.7, t));
        }
      }
      ppos.needsUpdate = true;
      pillarGeo.computeVertexNormals();

      const pillar = new THREE.Mesh(pillarGeo, mat());
      pillar.position.y = -0.28;
      pillar.castShadow = true;
      pillar.receiveShadow = true;
      addEdgeLines(pillar);

      // Side fairings
      const fairGeoL = new THREE.BoxGeometry(0.035, 0.14, 0.12);
      const fairL = new THREE.Mesh(fairGeoL, mat({ opacity: 0.93 }));
      fairL.position.set(-0.055, -0.20, 0);
      fairL.castShadow = true;

      const fairGeoR = new THREE.BoxGeometry(0.035, 0.14, 0.12);
      const fairR = new THREE.Mesh(fairGeoR, mat({ opacity: 0.93 }));
      fairR.position.set(0.055, -0.20, 0);
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

      // Organic oval cockpit surround
      const outerShape = new THREE.Shape();
      outerShape.absellipse(0, 0, 0.22, 0.36, 0, Math.PI * 2, false, 0);
      const innerHole = new THREE.Path();
      innerHole.absellipse(0, 0, 0.16, 0.29, 0, Math.PI * 2, false, 0);
      outerShape.holes.push(innerHole);

      const extrudeSettings = {
        depth: 0.08,
        bevelEnabled: true,
        bevelThickness: 0.018,
        bevelSize: 0.018,
        bevelSegments: 4,
      };
      const geo = new THREE.ExtrudeGeometry(outerShape, extrudeSettings);
      geo.rotateX(-Math.PI / 2);
      geo.center();
      const mesh = new THREE.Mesh(geo, mat());
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      addEdgeLines(mesh);
      group.add(mesh);

      // Headrest / padding behind cockpit — slightly rounded
      const headrestGeo = new THREE.BoxGeometry(0.12, 0.09, 0.10, 2, 2, 2);
      const hpos = headrestGeo.attributes.position;
      for (let i = 0; i < hpos.count; i++) {
        const xn = Math.abs(hpos.getX(i)) / 0.06;
        const yn = Math.abs(hpos.getY(i)) / 0.045;
        if (xn > 0.7 && yn > 0.7) {
          hpos.setX(i, hpos.getX(i) * 0.90);
          hpos.setY(i, hpos.getY(i) * 0.90);
        }
      }
      hpos.needsUpdate = true;
      headrestGeo.computeVertexNormals();

      const headrest = new THREE.Mesh(headrestGeo, mat({ opacity: 0.94 }));
      headrest.position.set(0, 0.02, 0.26);
      headrest.castShadow = true;
      addEdgeLines(headrest);
      group.add(headrest);

      return group;
    },
  },
];
