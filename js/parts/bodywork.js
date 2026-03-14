// ============================================================
//  Bodywork parts — outer carbon-fibre body panels and aero shell
//  Color: #C0C8D0 (silver metallic)
//  HIGH-POLY vertex-deformed geometry for smooth F1 outer shell
// ============================================================

import * as THREE from 'three';
import { addEdgeLines } from '../geometry/factories.js';

const GROUP = 'bodywork';
const COLOR = '#C0C8D0';

function mat(opts = {}) {
  return new THREE.MeshPhysicalMaterial({
    color: COLOR,
    metalness: 0.7,
    roughness: 0.15,
    clearcoat: 0.8,
    transparent: false,
    opacity: 1.0,
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

export const bodyworkParts = [
  // ---- Upper Body Shell -------------------------------------
  {
    id: 'upperBodyShell',
    name: 'Upper Body Shell',
    group: GROUP,
    description: 'Main visible car body panel — a wide, low shell covering the top of the car from the cockpit area rearward past the engine cover.',
    assembledPosition: [0, 0.38, 0.1],
    assembledRotation: [0, 0, 0],
    explosionDirection: [0, 1.0, 0],
    build({ addEdgeLines }) {
      const geo = new THREE.BoxGeometry(0.62, 0.08, 2.8, 6, 3, 18);
      const pos = geo.attributes.position;
      const halfW = 0.31;
      const halfL = 1.4;

      for (let i = 0; i < pos.count; i++) {
        let x = pos.getX(i);
        let y = pos.getY(i);
        const z = pos.getZ(i);

        const zNorm = z / halfL; // -1..1
        const xNorm = x / halfW;

        // --- Dome the top surface smoothly ---
        if (y > 0) {
          const distFromCenter = Math.abs(xNorm);
          const domeFactor = Math.cos(distFromCenter * Math.PI / 2);
          y += domeFactor * 0.035;
        }

        // --- Front taper: smooth parabolic narrowing ---
        if (zNorm < -0.1) {
          const t = smoothstep(-0.1, -1.0, zNorm);
          const frontTaper = lerp(1.0, 0.38, Math.pow(t, 1.2));
          x *= frontTaper;
          // Also reduce height at front
          y *= lerp(1.0, 0.7, t * 0.5);
        }

        // --- Rear coke-bottle taper ---
        if (zNorm > 0.0) {
          const t = smoothstep(0.0, 1.0, zNorm);
          const rearTaper = lerp(1.0, 0.42, Math.pow(t, 1.1));
          x *= rearTaper;
          // Lower the rear slightly
          y -= t * 0.01;
        }

        // --- Round the edges for organic shape ---
        const absXn = Math.abs(xNorm);
        if (absXn > 0.75) {
          const edgeT = (absXn - 0.75) / 0.25;
          // Pull corners inward and slightly down
          x *= lerp(1.0, 0.92, edgeT * edgeT);
          if (y > 0) {
            y *= lerp(1.0, 0.85, edgeT * edgeT);
          }
        }

        pos.setX(i, x);
        pos.setY(i, y);
      }
      pos.needsUpdate = true;
      geo.computeVertexNormals();

      const mesh = new THREE.Mesh(geo, mat());
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      addEdgeLines(mesh);
      return mesh;
    },
  },

  // ---- Nose Fairing -----------------------------------------
  {
    id: 'noseFairing',
    name: 'Nose Fairing',
    group: GROUP,
    description: 'Smooth nose cone skin covering the front section of the chassis — the aerodynamic leading edge of the car.',
    assembledPosition: [0, 0.20, -1.7],
    assembledRotation: [0, 0, 0],
    explosionDirection: [0, 0.3, -1.0],
    build({ addEdgeLines }) {
      const geo = new THREE.BoxGeometry(0.30, 0.14, 1.3, 5, 4, 12);
      const pos = geo.attributes.position;
      const halfW = 0.15;
      const halfH = 0.07;
      const halfL = 0.65;

      for (let i = 0; i < pos.count; i++) {
        let x = pos.getX(i);
        let y = pos.getY(i);
        const z = pos.getZ(i);

        const xNorm = x / halfW;
        const yNorm = y / halfH;
        const zNorm = z / halfL; // -1 (front/tip) to +1 (rear/base)

        // --- Smooth parabolic taper toward front ---
        if (zNorm < 0.2) {
          const t = smoothstep(0.2, -1.0, zNorm); // 0 at z=0.2, 1 at z=-1
          // Width: parabolic taper from full to 0.15
          const widthTaper = lerp(1.0, 0.15, Math.pow(t, 1.4));
          x *= widthTaper;
          // Height: taper from full to 0.30
          const heightTaper = lerp(1.0, 0.30, Math.pow(t, 1.3));
          y *= heightTaper;
        }

        // --- Nose droop ---
        if (zNorm < 0) {
          const droopT = smoothstep(0, -1.0, zNorm);
          y -= droopT * 0.04;
        }

        // --- Round cross-section ---
        const absXn = Math.abs(xNorm);
        const absYn = Math.abs(yNorm);
        const cornerR = 0.30;
        if (absXn > (1.0 - cornerR) && absYn > (1.0 - cornerR)) {
          const cx = 1.0 - cornerR;
          const cy = 1.0 - cornerR;
          const dx = absXn - cx;
          const dy = absYn - cy;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > cornerR) {
            const scale = cornerR / dist;
            x *= (cx + dx * scale) / absXn;
            y = Math.sign(y) * Math.abs(y) * ((cy + dy * scale) / absYn);
          }
        }

        // --- Slight dome on top ---
        if (yNorm > 0.3) {
          const domeFactor = Math.cos(Math.abs(xNorm) * Math.PI / 2);
          y += domeFactor * 0.008;
        }

        pos.setX(i, x);
        pos.setY(i, y);
      }
      pos.needsUpdate = true;
      geo.computeVertexNormals();

      const mesh = new THREE.Mesh(geo, mat());
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      addEdgeLines(mesh);
      return mesh;
    },
  },

  // ---- Left Side Panel --------------------------------------
  {
    id: 'leftSidePanel',
    name: 'Left Side Panel',
    group: GROUP,
    description: 'Left body panel filling the gap between the monocoque and sidepod — part of the car\'s visible livery surface.',
    assembledPosition: [-0.42, 0.18, 0.1],
    assembledRotation: [0, 0, 0],
    explosionDirection: [-1.0, 0.3, 0],
    build({ addEdgeLines }) {
      const geo = new THREE.BoxGeometry(0.12, 0.30, 1.8, 2, 3, 10);
      const pos = geo.attributes.position;
      const halfL = 0.9;

      for (let i = 0; i < pos.count; i++) {
        let x = pos.getX(i);
        const y = pos.getY(i);
        const z = pos.getZ(i);

        const zNorm = z / halfL; // -1..1
        const yNorm = y / 0.15;

        // Smooth outward bulge at the middle (car's waist)
        const bulgeFactor = Math.cos(zNorm * Math.PI / 2);
        const bulgeAmount = bulgeFactor * bulgeFactor * 0.025;
        if (x < 0) {
          x -= bulgeAmount;
        }

        // Smooth front taper using cosine
        if (zNorm < -0.3) {
          const t = smoothstep(-0.3, -1.0, zNorm);
          x *= lerp(1.0, 0.45, Math.pow(t, 1.2));
        }

        // Smooth rear taper (coke-bottle following sidepod)
        if (zNorm > 0.2) {
          const t = smoothstep(0.2, 1.0, zNorm);
          x *= lerp(1.0, 0.50, Math.pow(t, 1.1));
        }

        // Slight inward pull at top and bottom edges
        if (Math.abs(yNorm) > 0.7) {
          const edgeT = (Math.abs(yNorm) - 0.7) / 0.3;
          x *= lerp(1.0, 0.90, edgeT);
        }

        pos.setX(i, x);
      }
      pos.needsUpdate = true;
      geo.computeVertexNormals();

      const mesh = new THREE.Mesh(geo, mat());
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      addEdgeLines(mesh);
      return mesh;
    },
  },

  // ---- Right Side Panel -------------------------------------
  {
    id: 'rightSidePanel',
    name: 'Right Side Panel',
    group: GROUP,
    description: 'Right body panel filling the gap between the monocoque and sidepod — mirror of the left side panel.',
    assembledPosition: [0.42, 0.18, 0.1],
    assembledRotation: [0, 0, 0],
    explosionDirection: [1.0, 0.3, 0],
    build({ addEdgeLines }) {
      const geo = new THREE.BoxGeometry(0.12, 0.30, 1.8, 2, 3, 10);
      const pos = geo.attributes.position;
      const halfL = 0.9;

      for (let i = 0; i < pos.count; i++) {
        let x = pos.getX(i);
        const y = pos.getY(i);
        const z = pos.getZ(i);

        const zNorm = z / halfL;
        const yNorm = y / 0.15;

        // Smooth outward bulge (mirror of left)
        const bulgeFactor = Math.cos(zNorm * Math.PI / 2);
        const bulgeAmount = bulgeFactor * bulgeFactor * 0.025;
        if (x > 0) {
          x += bulgeAmount;
        }

        // Smooth front taper
        if (zNorm < -0.3) {
          const t = smoothstep(-0.3, -1.0, zNorm);
          x *= lerp(1.0, 0.45, Math.pow(t, 1.2));
        }

        // Smooth rear taper
        if (zNorm > 0.2) {
          const t = smoothstep(0.2, 1.0, zNorm);
          x *= lerp(1.0, 0.50, Math.pow(t, 1.1));
        }

        // Slight inward pull at top and bottom edges
        if (Math.abs(yNorm) > 0.7) {
          const edgeT = (Math.abs(yNorm) - 0.7) / 0.3;
          x *= lerp(1.0, 0.90, edgeT);
        }

        pos.setX(i, x);
      }
      pos.needsUpdate = true;
      geo.computeVertexNormals();

      const mesh = new THREE.Mesh(geo, mat());
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      addEdgeLines(mesh);
      return mesh;
    },
  },

  // ---- Rear Cowl --------------------------------------------
  {
    id: 'rearCowl',
    name: 'Rear Cowl',
    group: GROUP,
    description: 'Rear engine cowl panel covering the engine-to-gearbox transition area at the back of the car.',
    assembledPosition: [0, 0.32, 2.0],
    assembledRotation: [0, 0, 0],
    explosionDirection: [0, 0.5, 1.0],
    build({ addEdgeLines }) {
      const geo = new THREE.BoxGeometry(0.34, 0.12, 0.85, 4, 3, 8);
      const pos = geo.attributes.position;
      const halfW = 0.17;
      const halfH = 0.06;
      const halfL = 0.425;

      for (let i = 0; i < pos.count; i++) {
        let x = pos.getX(i);
        let y = pos.getY(i);
        const z = pos.getZ(i);

        const xNorm = x / halfW;
        const yNorm = y / halfH;
        const zNorm = z / halfL; // -1 (front) to +1 (rear)

        // Smooth taper toward rear
        if (zNorm > -0.2) {
          const t = smoothstep(-0.2, 1.0, zNorm);
          const taper = lerp(1.0, 0.40, Math.pow(t, 1.0));
          x *= taper;
          // Also reduce height
          y *= lerp(1.0, 0.75, t * 0.5);
        }

        // Dome the top
        if (yNorm > 0) {
          const domeFactor = Math.cos(Math.abs(xNorm) * Math.PI / 2);
          y += domeFactor * 0.012;
        }

        // Round edges
        const absXn = Math.abs(xNorm);
        if (absXn > 0.7) {
          const edgeT = (absXn - 0.7) / 0.3;
          if (yNorm > 0) {
            y *= lerp(1.0, 0.80, edgeT * edgeT);
          }
          x *= lerp(1.0, 0.94, edgeT * edgeT);
        }

        pos.setX(i, x);
        pos.setY(i, y);
      }
      pos.needsUpdate = true;
      geo.computeVertexNormals();

      const mesh = new THREE.Mesh(geo, mat());
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      addEdgeLines(mesh);
      return mesh;
    },
  },
];
