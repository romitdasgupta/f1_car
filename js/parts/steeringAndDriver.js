// ============================================================
//  Steering & Driver parts — steering column, wheel, seat
//  Color: #457B9D (steel blue)
// ============================================================

import * as THREE from 'three';
import { createSeatShape } from '../geometry/shapes.js';
import { addEdgeLines } from '../geometry/factories.js';

const GROUP = 'steering';
const COLOR = '#457B9D';

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

export const steeringAndDriverParts = [
  // ---- Steering Column --------------------------------------
  {
    id: 'steeringColumn',
    name: 'Steering Column',
    group: GROUP,
    description: 'Quick-release steering column — angled shaft connecting the steering wheel to the rack.',
    assembledPosition: [0, 0.38, -0.85],
    assembledRotation: [-0.5, 0, 0],
    explosionDirection: [0, 0.5, -0.8],
    build({ addEdgeLines }) {
      const group = new THREE.Group();

      // Main column shaft — inside the cockpit, angled forward
      const shaftGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.35, 12);
      const shaft = new THREE.Mesh(shaftGeo, mat({ metalness: 0.6, roughness: 0.2 }));
      shaft.castShadow = true;
      shaft.receiveShadow = true;
      addEdgeLines(shaft);
      group.add(shaft);

      // Quick-release coupling at the top
      const couplingGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.025, 16);
      const coupling = new THREE.Mesh(couplingGeo, mat({ metalness: 0.7, roughness: 0.15 }));
      coupling.position.y = 0.18;
      coupling.castShadow = true;
      coupling.receiveShadow = true;
      group.add(coupling);

      // Universal joint at the base
      const jointGeo = new THREE.SphereGeometry(0.015, 12, 8);
      const joint = new THREE.Mesh(jointGeo, mat({ metalness: 0.6 }));
      joint.position.y = -0.18;
      joint.castShadow = true;
      group.add(joint);

      return group;
    },
  },

  // ---- Steering Wheel ---------------------------------------
  {
    id: 'steeringWheel',
    name: 'Steering Wheel',
    group: GROUP,
    description: 'Carbon-fibre steering wheel with integrated display, 20+ buttons, rotary switches, and paddle shifters.',
    assembledPosition: [0, 0.45, -0.95],
    assembledRotation: [-0.5, 0, 0],
    explosionDirection: [0, 0.7, -0.7],
    build({ addEdgeLines }) {
      const group = new THREE.Group();

      // Main grip — partial torus (butterfly / yoke shape)
      const gripGeo = new THREE.TorusGeometry(0.11, 0.013, 12, 32, Math.PI * 1.5);
      const grip = new THREE.Mesh(gripGeo, mat({ metalness: 0.3, roughness: 0.5, color: '#333333' }));
      grip.rotation.z = Math.PI * 0.75;
      grip.castShadow = true;
      grip.receiveShadow = true;
      addEdgeLines(grip, '#555555');
      group.add(grip);

      // Top crossbar
      const crossbarGeo = new THREE.BoxGeometry(0.14, 0.022, 0.018);
      const crossbar = new THREE.Mesh(crossbarGeo, mat({ metalness: 0.3, color: '#333333' }));
      crossbar.position.y = 0.055;
      crossbar.castShadow = true;
      crossbar.receiveShadow = true;
      group.add(crossbar);

      // Centre display
      const displayGeo = new THREE.PlaneGeometry(0.09, 0.035);
      const displayMat = new THREE.MeshPhysicalMaterial({
        color: '#112244',
        metalness: 0.1,
        roughness: 0.8,
        emissive: '#223355',
        emissiveIntensity: 0.5,
        transparent: true,
        opacity: 0.9,
      });
      const display = new THREE.Mesh(displayGeo, displayMat);
      display.position.z = 0.014;
      display.castShadow = false;
      group.add(display);

      // Paddle shifters
      const paddleGeo = new THREE.BoxGeometry(0.012, 0.05, 0.035);
      const paddleL = new THREE.Mesh(paddleGeo, mat({ metalness: 0.5, color: '#444444' }));
      paddleL.position.set(-0.09, 0, -0.018);
      paddleL.castShadow = true;
      group.add(paddleL);

      const paddleR = new THREE.Mesh(paddleGeo.clone(), mat({ metalness: 0.5, color: '#444444' }));
      paddleR.position.set(0.09, 0, -0.018);
      paddleR.castShadow = true;
      group.add(paddleR);

      // Button nubs
      const btnGeo = new THREE.CylinderGeometry(0.005, 0.005, 0.007, 8);
      const buttonPositions = [
        [-0.035, 0.018], [-0.018, 0.025], [0.018, 0.025], [0.035, 0.018],
        [-0.025, -0.008], [0.025, -0.008],
      ];
      for (const [bx, by] of buttonPositions) {
        const btn = new THREE.Mesh(btnGeo, mat({ color: '#CC3344', metalness: 0.3 }));
        btn.position.set(bx, by, 0.013);
        btn.rotation.x = Math.PI / 2;
        group.add(btn);
      }

      return group;
    },
  },

  // ---- Driver Seat ------------------------------------------
  {
    id: 'driverSeat',
    name: 'Driver Seat',
    group: GROUP,
    description: 'Custom-moulded carbon-fibre driver seat with integrated head restraint padding.',
    assembledPosition: [0, 0.15, -0.4],
    assembledRotation: [0, 0, 0],
    explosionDirection: [0, 0.8, -0.4],
    build({ addEdgeLines }) {
      const shape = createSeatShape(0.3, 0.4);
      const extrudeSettings = {
        depth: 0.05,
        bevelEnabled: true,
        bevelThickness: 0.006,
        bevelSize: 0.006,
        bevelSegments: 2,
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
];
