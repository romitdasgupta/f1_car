// ============================================================
//  Steering & Driver parts — cockpit controls and safety gear
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
    opacity: 0.90,
    ...opts,
  });
}

function darkMat(opts = {}) {
  return new THREE.MeshPhysicalMaterial({
    color: '#2A3A4A',
    metalness: 0.2,
    roughness: 0.5,
    clearcoat: 0.4,
    transparent: true,
    opacity: 0.90,
    ...opts,
  });
}

// ---- Canvas LCD display texture for the steering wheel -----
function createSteeringDisplayTexture() {
  const w = 512, h = 200;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#080C14';
  ctx.fillRect(0, 0, w, h);

  // Border glow
  ctx.strokeStyle = '#2A5080';
  ctx.lineWidth = 3;
  ctx.strokeRect(2, 2, w - 4, h - 4);

  // ---- RPM bar (top) ----
  const barY = 12, barH = 22;
  const segments = 15;
  const segW = (w - 60) / segments;
  const activeSegments = 11;
  for (let i = 0; i < segments; i++) {
    const x = 30 + i * segW;
    let color;
    if (i < 5) color = '#00CC44';
    else if (i < 10) color = '#FFAA00';
    else if (i < 13) color = '#FF3300';
    else color = '#CC00FF';

    if (i < activeSegments) {
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 6;
    } else {
      ctx.fillStyle = '#151515';
      ctx.shadowBlur = 0;
    }
    ctx.fillRect(x, barY, segW - 3, barH);
  }
  ctx.shadowBlur = 0;

  // ---- Gear number (large, center) ----
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 72px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('4', w / 2, 90);

  // ---- Speed (left) ----
  ctx.fillStyle = '#00CCFF';
  ctx.font = 'bold 24px monospace';
  ctx.textAlign = 'right';
  ctx.fillText('247', w / 2 - 70, 75);
  ctx.fillStyle = '#668899';
  ctx.font = '12px monospace';
  ctx.fillText('KPH', w / 2 - 70, 92);

  // ---- RPM (right) ----
  ctx.fillStyle = '#00CCFF';
  ctx.font = 'bold 24px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('11.4', w / 2 + 50, 75);
  ctx.fillStyle = '#668899';
  ctx.font = '12px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('RPM×1K', w / 2 + 48, 92);

  // ---- Bottom data row ----
  const dataY = 140;
  const labels = ['ERS', 'BRAKE', 'DIFF', 'MIX', 'TYRE'];
  const values = ['76%', 'HI-2', 'EN+3', 'M-8', '42°C'];
  const colors = ['#00FF88', '#FF6644', '#FFAA00', '#AA88FF', '#FFCC00'];
  const spacing = w / (labels.length + 1);

  for (let i = 0; i < labels.length; i++) {
    const x = spacing * (i + 1);
    ctx.fillStyle = '#445566';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(labels[i], x, dataY - 8);
    ctx.fillStyle = colors[i];
    ctx.font = 'bold 16px monospace';
    ctx.fillText(values[i], x, dataY + 10);
  }

  // ---- Delta time ----
  ctx.fillStyle = '#00FF66';
  ctx.font = 'bold 18px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('-0.134', w / 2, h - 16);
  ctx.fillStyle = '#556677';
  ctx.font = '10px monospace';
  ctx.fillText('DELTA', w / 2, h - 34);

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

// ---- Shift indicator LED strip ----
function createShiftLEDTexture() {
  const w = 256, h = 32;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#050505';
  ctx.fillRect(0, 0, w, h);

  const leds = 15;
  const ledR = 6;
  const spacing = w / (leds + 1);
  const activeCount = 11;

  for (let i = 0; i < leds; i++) {
    const x = spacing * (i + 1);
    const y = h / 2;
    let color;
    if (i < 5) color = '#00CC44';
    else if (i < 10) color = '#FFAA00';
    else color = '#FF2200';

    ctx.beginPath();
    ctx.arc(x, y, ledR, 0, Math.PI * 2);
    if (i < activeCount) {
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 8;
    } else {
      ctx.fillStyle = '#181818';
      ctx.shadowBlur = 0;
    }
    ctx.fill();
  }
  ctx.shadowBlur = 0;

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

export const steeringAndDriverParts = [
  // ---- Steering Column --------------------------------------
  {
    id: 'steeringColumn',
    name: 'Steering Column',
    group: GROUP,
    description: 'Quick-release steering column with universal joints — angled carbon shaft connecting the steering wheel to the rack-and-pinion mechanism in the nosecone.',
    assembledPosition: [0, 0.38, -0.85],
    assembledRotation: [-0.5, 0, 0],
    explosionDirection: [0, 0.5, -0.8],
    build({ addEdgeLines }) {
      const group = new THREE.Group();

      // Main column shaft
      const shaftGeo = new THREE.CylinderGeometry(0.022, 0.022, 0.50, 12);
      const shaft = new THREE.Mesh(shaftGeo, mat({ metalness: 0.5, roughness: 0.25 }));
      shaft.castShadow = true;
      shaft.receiveShadow = true;
      addEdgeLines(shaft);
      group.add(shaft);

      // Quick-release coupling at the top
      const couplingGeo = new THREE.CylinderGeometry(0.040, 0.040, 0.035, 16);
      const coupling = new THREE.Mesh(couplingGeo, mat({ metalness: 0.7, roughness: 0.15 }));
      coupling.position.y = 0.26;
      coupling.castShadow = true;
      addEdgeLines(coupling);
      group.add(coupling);

      // Quick-release pins (6 around the coupling)
      const pinGeo = new THREE.CylinderGeometry(0.005, 0.005, 0.020, 6);
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        const pin = new THREE.Mesh(pinGeo, mat({ color: '#AABBCC', metalness: 0.8 }));
        pin.position.set(Math.cos(angle) * 0.032, 0.26, Math.sin(angle) * 0.032);
        pin.rotation.x = Math.PI / 2;
        group.add(pin);
      }

      // Universal joint at the base
      const jointGeo = new THREE.SphereGeometry(0.028, 12, 8);
      const joint = new THREE.Mesh(jointGeo, mat({ metalness: 0.6, color: '#5A8AAD' }));
      joint.position.y = -0.26;
      joint.castShadow = true;
      group.add(joint);

      // Lower shaft (below U-joint)
      const lowerGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.10, 10);
      const lower = new THREE.Mesh(lowerGeo, mat({ metalness: 0.4 }));
      lower.position.y = -0.32;
      group.add(lower);

      return group;
    },
  },

  // ---- Steering Wheel (enhanced) ----------------------------
  {
    id: 'steeringWheel',
    name: 'Steering Wheel',
    group: GROUP,
    description: 'Carbon-fibre F1 steering wheel with 4.3″ LCD display showing RPM, gear, speed, ERS status, and delta times. Features 25+ buttons, 4 rotary encoders, thumb wheels, clutch paddles, and gear shift paddles — the driver\'s complete interface to the car.',
    assembledPosition: [0, 0.45, -0.95],
    assembledRotation: [-0.5, 0, 0],
    explosionDirection: [0, 0.7, -0.7],
    build({ addEdgeLines }) {
      const group = new THREE.Group();

      // ---- Main body plate (rectangular with rounded corners) ----
      const plateShape = new THREE.Shape();
      const pw = 0.24, ph = 0.14, pr = 0.018;
      plateShape.moveTo(-pw + pr, -ph);
      plateShape.lineTo(pw - pr, -ph);
      plateShape.quadraticCurveTo(pw, -ph, pw, -ph + pr);
      plateShape.lineTo(pw, ph - pr);
      plateShape.quadraticCurveTo(pw, ph, pw - pr, ph);
      plateShape.lineTo(-pw + pr, ph);
      plateShape.quadraticCurveTo(-pw, ph, -pw, ph - pr);
      plateShape.lineTo(-pw, -ph + pr);
      plateShape.quadraticCurveTo(-pw, -ph, -pw + pr, -ph);

      const plateGeo = new THREE.ExtrudeGeometry(plateShape, {
        depth: 0.025, bevelEnabled: true, bevelThickness: 0.004,
        bevelSize: 0.004, bevelSegments: 2,
      });
      plateGeo.center();
      const plate = new THREE.Mesh(plateGeo, darkMat());
      plate.castShadow = true;
      plate.receiveShadow = true;
      addEdgeLines(plate, '#4A90D9');
      group.add(plate);

      // ---- Grips (left and right handles) ----
      const gripShape = new THREE.Shape();
      gripShape.moveTo(0, -0.06);
      gripShape.quadraticCurveTo(0.025, -0.06, 0.025, -0.04);
      gripShape.lineTo(0.025, 0.04);
      gripShape.quadraticCurveTo(0.025, 0.06, 0, 0.06);
      gripShape.quadraticCurveTo(-0.018, 0.06, -0.018, 0.04);
      gripShape.lineTo(-0.018, -0.04);
      gripShape.quadraticCurveTo(-0.018, -0.06, 0, -0.06);

      const gripSettings = { depth: 0.038, bevelEnabled: true, bevelThickness: 0.005, bevelSize: 0.005, bevelSegments: 3 };

      const gripLGeo = new THREE.ExtrudeGeometry(gripShape, gripSettings);
      gripLGeo.center();
      const gripL = new THREE.Mesh(gripLGeo, mat({ color: '#3A5A7A', roughness: 0.7 }));
      gripL.position.set(-0.26, 0, 0);
      gripL.rotation.y = Math.PI / 2;
      gripL.castShadow = true;
      addEdgeLines(gripL, '#4A90D9');
      group.add(gripL);

      const gripRGeo = new THREE.ExtrudeGeometry(gripShape, gripSettings);
      gripRGeo.center();
      const gripR = new THREE.Mesh(gripRGeo, mat({ color: '#3A5A7A', roughness: 0.7 }));
      gripR.position.set(0.26, 0, 0);
      gripR.rotation.y = Math.PI / 2;
      gripR.castShadow = true;
      addEdgeLines(gripR, '#4A90D9');
      group.add(gripR);

      // ---- LCD Display (canvas texture — large and glowing) ----
      const displayGeo = new THREE.PlaneGeometry(0.18, 0.072);
      const displayTex = createSteeringDisplayTexture();
      const displayMat = new THREE.MeshBasicMaterial({ map: displayTex, transparent: true, opacity: 0.95 });
      const display = new THREE.Mesh(displayGeo, displayMat);
      display.position.set(0, 0.02, 0.016);
      group.add(display);

      // Display bezel
      const bezelGeo = new THREE.PlaneGeometry(0.195, 0.082);
      const bezel = new THREE.Mesh(bezelGeo, darkMat({ color: '#0A0E14' }));
      bezel.position.set(0, 0.02, 0.0155);
      group.add(bezel);

      // ---- Shift indicator LEDs (top row) ----
      const ledGeo = new THREE.PlaneGeometry(0.22, 0.018);
      const ledTex = createShiftLEDTexture();
      const ledMat = new THREE.MeshBasicMaterial({ map: ledTex, transparent: true });
      const leds = new THREE.Mesh(ledGeo, ledMat);
      leds.position.set(0, 0.095, 0.016);
      group.add(leds);

      // ---- Gear shift paddles (behind the wheel) ----
      const paddleShape = new THREE.Shape();
      paddleShape.moveTo(0, -0.05);
      paddleShape.lineTo(0.025, -0.04);
      paddleShape.lineTo(0.025, 0.04);
      paddleShape.lineTo(0, 0.05);
      paddleShape.lineTo(-0.008, 0.04);
      paddleShape.lineTo(-0.008, -0.04);
      paddleShape.lineTo(0, -0.05);

      const paddleGeo = new THREE.ExtrudeGeometry(paddleShape, {
        depth: 0.005, bevelEnabled: true, bevelThickness: 0.002, bevelSize: 0.002, bevelSegments: 1,
      });
      paddleGeo.center();

      const paddleL = new THREE.Mesh(paddleGeo, mat({ metalness: 0.5, color: '#5588AA' }));
      paddleL.position.set(-0.17, -0.02, -0.028);
      paddleL.castShadow = true;
      addEdgeLines(paddleL, '#4A90D9');
      group.add(paddleL);

      const paddleR = new THREE.Mesh(paddleGeo.clone(), mat({ metalness: 0.5, color: '#5588AA' }));
      paddleR.position.set(0.17, -0.02, -0.028);
      paddleR.castShadow = true;
      addEdgeLines(paddleR, '#4A90D9');
      group.add(paddleR);

      // ---- Clutch paddles (smaller, behind) ----
      const clutchGeo = new THREE.BoxGeometry(0.012, 0.05, 0.005);
      const clutchL = new THREE.Mesh(clutchGeo, mat({ metalness: 0.4, color: '#4A7090' }));
      clutchL.position.set(-0.12, -0.04, -0.025);
      addEdgeLines(clutchL, '#4A90D9');
      group.add(clutchL);
      const clutchR = new THREE.Mesh(clutchGeo.clone(), mat({ metalness: 0.4, color: '#4A7090' }));
      clutchR.position.set(0.12, -0.04, -0.025);
      addEdgeLines(clutchR, '#4A90D9');
      group.add(clutchR);

      // ---- Buttons — coloured by function ----
      const btnGeo = new THREE.CylinderGeometry(0.009, 0.009, 0.007, 10);
      const buttons = [
        [-0.09, 0.075, '#FF2200'],   // pit limiter
        [-0.06, 0.082, '#0088FF'],   // radio
        [-0.025, 0.084, '#FF8800'],  // neutral
        [0.025, 0.084, '#FFDD00'],   // DRS
        [0.06, 0.082, '#00CC44'],    // acknowledge
        [0.09, 0.075, '#FF2200'],    // overtake
        [-0.09, -0.055, '#AA44FF'],  // engine mode
        [-0.06, -0.065, '#FF6600'],  // brake bias
        [-0.025, -0.070, '#00AAFF'], // diff entry
        [0.025, -0.070, '#00AAFF'],  // diff mid
        [0.06, -0.065, '#FF6600'],   // diff exit
        [0.09, -0.055, '#AA44FF'],   // tyre select
      ];

      for (const [bx, by, color] of buttons) {
        const btn = new THREE.Mesh(btnGeo, new THREE.MeshPhysicalMaterial({
          color, metalness: 0.3, roughness: 0.4,
          emissive: color, emissiveIntensity: 0.4,
          transparent: true, opacity: 0.95,
        }));
        btn.position.set(bx, by, 0.016);
        btn.rotation.x = Math.PI / 2;
        group.add(btn);
      }

      // ---- Rotary encoders (4 knobs) ----
      const knobGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.012, 12);
      const knobPositions = [
        [-0.15, 0.06],
        [-0.15, -0.035],
        [0.15, 0.06],
        [0.15, -0.035],
      ];

      for (const [kx, ky] of knobPositions) {
        const knob = new THREE.Mesh(knobGeo, mat({ color: '#7AAABB', metalness: 0.7, roughness: 0.2 }));
        knob.position.set(kx, ky, 0.016);
        knob.rotation.x = Math.PI / 2;
        group.add(knob);
        // Indicator line
        const lineGeo = new THREE.BoxGeometry(0.002, 0.010, 0.002);
        const line = new THREE.Mesh(lineGeo, new THREE.MeshBasicMaterial({ color: '#FFFFFF' }));
        line.position.set(kx, ky + 0.005, 0.024);
        group.add(line);
      }

      // ---- Thumb wheels (on grip sides) ----
      const thumbGeo = new THREE.CylinderGeometry(0.010, 0.010, 0.020, 8);
      const thumbL = new THREE.Mesh(thumbGeo, mat({ color: '#6090AA', metalness: 0.6 }));
      thumbL.position.set(-0.20, 0.01, 0.005);
      thumbL.rotation.z = Math.PI / 2;
      group.add(thumbL);
      const thumbR = new THREE.Mesh(thumbGeo.clone(), mat({ color: '#6090AA', metalness: 0.6 }));
      thumbR.position.set(0.20, 0.01, 0.005);
      thumbR.rotation.z = Math.PI / 2;
      group.add(thumbR);

      return group;
    },
  },

  // ---- Pedal Assembly ---------------------------------------
  {
    id: 'pedalAssembly',
    name: 'Pedal Assembly',
    group: GROUP,
    description: 'Titanium pedal box with brake and throttle pedals — F1 cars have no clutch pedal (clutch is on the steering wheel). Brake pedal pressure can exceed 150kg. Pedals are adjustable forward/back.',
    assembledPosition: [0, 0.10, -1.30],
    assembledRotation: [0, 0, 0],
    explosionDirection: [0, 0.3, -0.9],
    build({ addEdgeLines }) {
      const group = new THREE.Group();

      // Pedal box housing (titanium bulkhead)
      const boxGeo = new THREE.BoxGeometry(0.34, 0.16, 0.10, 4, 2, 2);
      const box = new THREE.Mesh(boxGeo, mat({ metalness: 0.6, roughness: 0.25 }));
      box.position.y = 0.03;
      box.castShadow = true;
      box.receiveShadow = true;
      addEdgeLines(box, '#4A90D9');
      group.add(box);

      // Master cylinder housings (top)
      const mcGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.09, 10);
      const mcL = new THREE.Mesh(mcGeo, mat({ metalness: 0.7, color: '#5A8AAD' }));
      mcL.position.set(-0.06, 0.12, 0);
      mcL.rotation.x = Math.PI / 2;
      addEdgeLines(mcL, '#4A90D9');
      group.add(mcL);
      const mcR = new THREE.Mesh(mcGeo.clone(), mat({ metalness: 0.7, color: '#5A8AAD' }));
      mcR.position.set(0.06, 0.12, 0);
      mcR.rotation.x = Math.PI / 2;
      addEdgeLines(mcR, '#4A90D9');
      group.add(mcR);

      // ---- Brake pedal (left, wider) ----
      const brakeArmGeo = new THREE.BoxGeometry(0.018, 0.22, 0.012);
      const brakeArm = new THREE.Mesh(brakeArmGeo, mat({ metalness: 0.5 }));
      brakeArm.position.set(-0.06, -0.06, 0.055);
      brakeArm.rotation.x = 0.25;
      brakeArm.castShadow = true;
      group.add(brakeArm);

      // Brake foot pad (red)
      const brakePadGeo = new THREE.BoxGeometry(0.09, 0.006, 0.06);
      const brakePad = new THREE.Mesh(brakePadGeo, new THREE.MeshPhysicalMaterial({
        color: '#DD3333', metalness: 0.3, roughness: 0.5, emissive: '#DD3333',
        emissiveIntensity: 0.15, transparent: true, opacity: 0.92,
      }));
      brakePad.position.set(-0.06, -0.16, 0.09);
      brakePad.rotation.x = 0.6;
      brakePad.castShadow = true;
      addEdgeLines(brakePad, '#FF4444');
      group.add(brakePad);

      // ---- Throttle pedal (right, narrower, green) ----
      const throttleArmGeo = new THREE.BoxGeometry(0.012, 0.22, 0.010);
      const throttleArm = new THREE.Mesh(throttleArmGeo, mat({ metalness: 0.5 }));
      throttleArm.position.set(0.06, -0.06, 0.055);
      throttleArm.rotation.x = 0.25;
      throttleArm.castShadow = true;
      group.add(throttleArm);

      const throttlePadGeo = new THREE.BoxGeometry(0.055, 0.006, 0.06);
      const throttlePad = new THREE.Mesh(throttlePadGeo, new THREE.MeshPhysicalMaterial({
        color: '#33AA44', metalness: 0.3, roughness: 0.5, emissive: '#33AA44',
        emissiveIntensity: 0.15, transparent: true, opacity: 0.92,
      }));
      throttlePad.position.set(0.06, -0.16, 0.09);
      throttlePad.rotation.x = 0.6;
      throttlePad.castShadow = true;
      addEdgeLines(throttlePad, '#44CC55');
      group.add(throttlePad);

      // Adjustment rails
      const railGeo = new THREE.BoxGeometry(0.008, 0.008, 0.12);
      const railMat = mat({ color: '#7AAABB', metalness: 0.8 });
      const railL = new THREE.Mesh(railGeo, railMat);
      railL.position.set(-0.12, -0.06, 0.04);
      group.add(railL);
      const railR = new THREE.Mesh(railGeo.clone(), railMat);
      railR.position.set(0.12, -0.06, 0.04);
      group.add(railR);

      return group;
    },
  },

  // ---- Dashboard / Shift Indicator --------------------------
  {
    id: 'dashboard',
    name: 'Dashboard Panel',
    group: GROUP,
    description: 'Carbon-fibre dashboard with additional warning LEDs, rain light status, pit lane indicator, and wiring loom connections for the steering wheel quick-release.',
    assembledPosition: [0, 0.42, -0.78],
    assembledRotation: [-0.3, 0, 0],
    explosionDirection: [0, 0.6, -0.6],
    build({ addEdgeLines }) {
      const group = new THREE.Group();

      // Dashboard plate
      const dashShape = new THREE.Shape();
      dashShape.moveTo(-0.20, -0.06);
      dashShape.lineTo(0.20, -0.06);
      dashShape.quadraticCurveTo(0.22, -0.06, 0.22, -0.04);
      dashShape.lineTo(0.22, 0.04);
      dashShape.quadraticCurveTo(0.22, 0.06, 0.20, 0.06);
      dashShape.lineTo(-0.20, 0.06);
      dashShape.quadraticCurveTo(-0.22, 0.06, -0.22, 0.04);
      dashShape.lineTo(-0.22, -0.04);
      dashShape.quadraticCurveTo(-0.22, -0.06, -0.20, -0.06);

      const dashGeo = new THREE.ExtrudeGeometry(dashShape, {
        depth: 0.012, bevelEnabled: true, bevelThickness: 0.003, bevelSize: 0.003, bevelSegments: 1,
      });
      dashGeo.center();
      const dash = new THREE.Mesh(dashGeo, mat());
      dash.castShadow = true;
      addEdgeLines(dash, '#4A90D9');
      group.add(dash);

      // Warning indicator LEDs (larger, emissive)
      const warningGeo = new THREE.SphereGeometry(0.008, 10, 8);
      const warnings = [
        [-0.13, 0.03, '#FF0000', 'OIL P'],
        [-0.08, 0.03, '#FF8800', 'OIL T'],
        [-0.03, 0.03, '#FFDD00', 'BATT'],
        [0.03, 0.03, '#00FF44', 'ERS'],
        [0.08, 0.03, '#0088FF', 'DRS'],
        [0.13, 0.03, '#FF00FF', 'PIT'],
      ];

      for (const [wx, wy, color] of warnings) {
        const led = new THREE.Mesh(warningGeo, new THREE.MeshPhysicalMaterial({
          color, emissive: color, emissiveIntensity: 0.8,
          metalness: 0.1, roughness: 0.3, transparent: true, opacity: 0.95,
        }));
        led.position.set(wx, wy, 0.010);
        group.add(led);
      }

      // Wiring loom connector
      const connGeo = new THREE.CylinderGeometry(0.028, 0.028, 0.020, 12);
      const conn = new THREE.Mesh(connGeo, mat({ color: '#5A8AAD', metalness: 0.5 }));
      conn.position.set(0, -0.015, -0.008);
      conn.rotation.x = Math.PI / 2;
      addEdgeLines(conn, '#4A90D9');
      group.add(conn);

      // Wiring bundles
      const wireCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.12, -0.03, 0),
        new THREE.Vector3(-0.08, -0.05, -0.015),
        new THREE.Vector3(-0.03, -0.05, -0.02),
        new THREE.Vector3(0, -0.03, -0.015),
      ]);
      const wireGeo = new THREE.TubeGeometry(wireCurve, 12, 0.006, 6, false);
      group.add(new THREE.Mesh(wireGeo, mat({ color: '#3A5A7A', roughness: 0.7 })));

      const wireCurve2 = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.12, -0.03, 0),
        new THREE.Vector3(0.08, -0.05, -0.015),
        new THREE.Vector3(0.03, -0.05, -0.02),
        new THREE.Vector3(0, -0.03, -0.015),
      ]);
      const wireGeo2 = new THREE.TubeGeometry(wireCurve2, 12, 0.006, 6, false);
      group.add(new THREE.Mesh(wireGeo2, mat({ color: '#3A5A7A', roughness: 0.7 })));

      return group;
    },
  },

  // ---- Headrest & HANS Device --------------------------------
  {
    id: 'headrest',
    name: 'Headrest & HANS',
    group: GROUP,
    description: 'Energy-absorbing headrest padded with Confor foam, integrated with the HANS (Head and Neck Support) device tethers. Limits head movement during impacts to prevent basilar skull fractures.',
    assembledPosition: [0, 0.48, -0.12],
    assembledRotation: [0, 0, 0],
    explosionDirection: [0, 0.9, -0.2],
    build({ addEdgeLines }) {
      const group = new THREE.Group();

      // Main headrest pad (scaled up)
      const padGeo = new THREE.BoxGeometry(0.30, 0.20, 0.08, 6, 4, 2);
      const padVerts = padGeo.attributes.position;
      for (let i = 0; i < padVerts.count; i++) {
        const x = padVerts.getX(i);
        const y = padVerts.getY(i);
        const dist = Math.sqrt(x * x + y * y);
        const maxDist = 0.18;
        if (dist > maxDist * 0.7) {
          const scale = 1 - Math.pow(Math.max(0, (dist - maxDist * 0.7) / (maxDist * 0.5)), 2) * 0.3;
          padVerts.setZ(i, padVerts.getZ(i) * scale);
        }
        const centerDip = Math.exp(-x * x / 0.003) * 0.02;
        padVerts.setZ(i, padVerts.getZ(i) - centerDip);
      }
      padVerts.needsUpdate = true;
      padGeo.computeVertexNormals();

      const pad = new THREE.Mesh(padGeo, mat({ color: '#3A5570', roughness: 0.7 }));
      pad.castShadow = true;
      pad.receiveShadow = true;
      addEdgeLines(pad, '#4A90D9');
      group.add(pad);

      // Foam padding (lighter inner)
      const foamGeo = new THREE.PlaneGeometry(0.18, 0.12);
      const foam = new THREE.Mesh(foamGeo, mat({ color: '#4A6A80', roughness: 0.9, opacity: 0.75 }));
      foam.position.z = 0.042;
      group.add(foam);

      // HANS tether attachment points
      const tetherGeo = new THREE.BoxGeometry(0.03, 0.012, 0.035);
      const tetherL = new THREE.Mesh(tetherGeo, mat({ metalness: 0.5 }));
      tetherL.position.set(-0.13, -0.06, 0);
      addEdgeLines(tetherL, '#4A90D9');
      group.add(tetherL);
      const tetherR = new THREE.Mesh(tetherGeo.clone(), mat({ metalness: 0.5 }));
      tetherR.position.set(0.13, -0.06, 0);
      addEdgeLines(tetherR, '#4A90D9');
      group.add(tetherR);

      // HANS yoke (U-shaped piece on shoulders)
      const hansCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.15, -0.12, 0.01),
        new THREE.Vector3(-0.12, -0.18, 0.005),
        new THREE.Vector3(-0.04, -0.21, 0),
        new THREE.Vector3(0, -0.20, 0),
        new THREE.Vector3(0.04, -0.21, 0),
        new THREE.Vector3(0.12, -0.18, 0.005),
        new THREE.Vector3(0.15, -0.12, 0.01),
      ]);
      const hansGeo = new THREE.TubeGeometry(hansCurve, 16, 0.012, 6, false);
      const hans = new THREE.Mesh(hansGeo, mat({ color: '#3A5A70' }));
      hans.castShadow = true;
      addEdgeLines(hans, '#4A90D9');
      group.add(hans);

      return group;
    },
  },

  // ---- 6-Point Harness --------------------------------------
  {
    id: 'harness',
    name: '6-Point Harness',
    group: GROUP,
    description: 'FIA-homologated 6-point safety harness — two shoulder straps, two lap straps, and two anti-submarine (crotch) straps all meeting at a quick-release rotary buckle. Webbing is rated to 14kN per strap.',
    assembledPosition: [0, 0.22, -0.35],
    assembledRotation: [0, 0, 0],
    explosionDirection: [0, 0.8, -0.3],
    build({ addEdgeLines }) {
      const group = new THREE.Group();

      const strapMat = new THREE.MeshPhysicalMaterial({
        color: '#DD3333', metalness: 0.05, roughness: 0.7,
        emissive: '#DD3333', emissiveIntensity: 0.1,
        transparent: true, opacity: 0.92,
      });

      // Central buckle (rotary quick-release — larger)
      const buckleGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.012, 16);
      const buckle = new THREE.Mesh(buckleGeo, mat({ color: '#CCCCCC', metalness: 0.8, roughness: 0.15 }));
      buckle.rotation.x = Math.PI / 2;
      buckle.position.set(0, 0, 0.025);
      buckle.castShadow = true;
      addEdgeLines(buckle, '#FFFFFF');
      group.add(buckle);

      // Buckle release tab
      const tabGeo = new THREE.CylinderGeometry(0.024, 0.020, 0.006, 6);
      const tab = new THREE.Mesh(tabGeo, new THREE.MeshPhysicalMaterial({
        color: '#FF3333', metalness: 0.3, emissive: '#FF3333', emissiveIntensity: 0.3,
        transparent: true, opacity: 0.95,
      }));
      tab.rotation.x = Math.PI / 2;
      tab.position.set(0, 0, 0.032);
      group.add(tab);

      // Shoulder straps (thicker)
      const shoulderL = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0, 0.025),
        new THREE.Vector3(-0.06, 0.08, 0.02),
        new THREE.Vector3(-0.09, 0.20, 0.015),
        new THREE.Vector3(-0.09, 0.32, 0.008),
      ]);
      group.add(new THREE.Mesh(new THREE.TubeGeometry(shoulderL, 14, 0.018, 5, false), strapMat));

      const shoulderR = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0, 0.025),
        new THREE.Vector3(0.06, 0.08, 0.02),
        new THREE.Vector3(0.09, 0.20, 0.015),
        new THREE.Vector3(0.09, 0.32, 0.008),
      ]);
      group.add(new THREE.Mesh(new THREE.TubeGeometry(shoulderR, 14, 0.018, 5, false), strapMat));

      // Lap straps
      const lapL = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0, 0.025),
        new THREE.Vector3(-0.07, -0.015, 0.025),
        new THREE.Vector3(-0.15, -0.03, 0.02),
        new THREE.Vector3(-0.20, -0.03, 0.015),
      ]);
      group.add(new THREE.Mesh(new THREE.TubeGeometry(lapL, 12, 0.018, 5, false), strapMat));

      const lapR = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0, 0.025),
        new THREE.Vector3(0.07, -0.015, 0.025),
        new THREE.Vector3(0.15, -0.03, 0.02),
        new THREE.Vector3(0.20, -0.03, 0.015),
      ]);
      group.add(new THREE.Mesh(new THREE.TubeGeometry(lapR, 12, 0.018, 5, false), strapMat));

      // Anti-submarine straps
      const subL = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0, 0.025),
        new THREE.Vector3(-0.03, -0.09, 0.022),
        new THREE.Vector3(-0.04, -0.18, 0.015),
      ]);
      group.add(new THREE.Mesh(new THREE.TubeGeometry(subL, 10, 0.015, 5, false), strapMat));

      const subR = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0, 0.025),
        new THREE.Vector3(0.03, -0.09, 0.022),
        new THREE.Vector3(0.04, -0.18, 0.015),
      ]);
      group.add(new THREE.Mesh(new THREE.TubeGeometry(subR, 10, 0.015, 5, false), strapMat));

      // Adjuster hardware on straps
      const adjGeo = new THREE.BoxGeometry(0.028, 0.012, 0.008);
      const adjMat = mat({ color: '#AABBCC', metalness: 0.7 });
      const adjL = new THREE.Mesh(adjGeo, adjMat);
      adjL.position.set(-0.085, 0.15, 0.018);
      group.add(adjL);
      const adjR = new THREE.Mesh(adjGeo.clone(), adjMat);
      adjR.position.set(0.085, 0.15, 0.018);
      group.add(adjR);

      return group;
    },
  },

  // ---- Driver Seat ------------------------------------------
  {
    id: 'driverSeat',
    name: 'Driver Seat',
    group: GROUP,
    description: 'Custom-moulded carbon-fibre seat insert — each driver has a bespoke mould taken from a body cast. Weighs under 1kg. Integrates with survival cell and has extractable design for driver removal after accidents.',
    assembledPosition: [0, 0.15, -0.4],
    assembledRotation: [0, 0, 0],
    explosionDirection: [0, 0.8, -0.4],
    build({ addEdgeLines }) {
      const group = new THREE.Group();

      // Seat shell (steel blue)
      const shape = createSeatShape(0.34, 0.45);
      const geo = new THREE.ExtrudeGeometry(shape, {
        depth: 0.06, bevelEnabled: true, bevelThickness: 0.008,
        bevelSize: 0.008, bevelSegments: 2,
      });
      geo.center();
      const shell = new THREE.Mesh(geo, mat());
      shell.castShadow = true;
      shell.receiveShadow = true;
      addEdgeLines(shell, '#4A90D9');
      group.add(shell);

      // Inner padding (darker shade)
      const padShape = createSeatShape(0.27, 0.38);
      const padGeo = new THREE.ExtrudeGeometry(padShape, {
        depth: 0.04, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.006, bevelSegments: 2,
      });
      padGeo.center();
      const padding = new THREE.Mesh(padGeo, mat({ color: '#3A5570', roughness: 0.8 }));
      padding.position.z = 0.015;
      group.add(padding);

      // Seat mounting rails
      const railGeo = new THREE.BoxGeometry(0.010, 0.010, 0.30);
      const railMat = mat({ color: '#7AAABB', metalness: 0.7 });
      const railL = new THREE.Mesh(railGeo, railMat);
      railL.position.set(-0.12, -0.25, 0.025);
      group.add(railL);
      const railR = new THREE.Mesh(railGeo.clone(), railMat);
      railR.position.set(0.12, -0.25, 0.025);
      group.add(railR);

      return group;
    },
  },

  // ---- Drink System -----------------------------------------
  {
    id: 'drinkSystem',
    name: 'Drink System',
    group: GROUP,
    description: 'Pressurised drinks bottle (up to 1.5L) with delivery tube routed to the driver\'s helmet. Activated via a button on the steering wheel. Contains electrolyte solution — drivers can lose up to 3kg of body weight during a race.',
    assembledPosition: [0.10, 0.16, -0.30],
    assembledRotation: [0, 0, 0],
    explosionDirection: [0.5, 0.5, -0.3],
    build({ addEdgeLines }) {
      const group = new THREE.Group();

      // Bottle body (larger, translucent blue)
      const bottleGeo = new THREE.CylinderGeometry(0.04, 0.032, 0.18, 12);
      const bottle = new THREE.Mesh(bottleGeo, new THREE.MeshPhysicalMaterial({
        color: '#4080BB', metalness: 0.1, roughness: 0.4,
        transparent: true, opacity: 0.65,
      }));
      bottle.castShadow = true;
      addEdgeLines(bottle, '#4A90D9');
      group.add(bottle);

      // Cap
      const capGeo = new THREE.CylinderGeometry(0.024, 0.028, 0.022, 12);
      const cap = new THREE.Mesh(capGeo, mat({ metalness: 0.6 }));
      cap.position.y = 0.10;
      addEdgeLines(cap, '#4A90D9');
      group.add(cap);

      // Delivery tube
      const tubeCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0.11, 0),
        new THREE.Vector3(-0.03, 0.15, 0.015),
        new THREE.Vector3(-0.06, 0.22, 0.025),
        new THREE.Vector3(-0.09, 0.30, 0.02),
        new THREE.Vector3(-0.12, 0.38, 0.015),
      ]);
      const tubeGeo = new THREE.TubeGeometry(tubeCurve, 16, 0.005, 6, false);
      group.add(new THREE.Mesh(tubeGeo, new THREE.MeshPhysicalMaterial({
        color: '#6AA0CC', metalness: 0.1, roughness: 0.4,
        transparent: true, opacity: 0.8,
      })));

      // Quick-connect fitting
      const fittingGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.015, 8);
      const fitting = new THREE.Mesh(fittingGeo, mat({ metalness: 0.7 }));
      fitting.position.set(-0.12, 0.38, 0.015);
      group.add(fitting);

      // Mounting bracket
      const bracketGeo = new THREE.BoxGeometry(0.06, 0.020, 0.012);
      const bracket = new THREE.Mesh(bracketGeo, mat({ metalness: 0.5 }));
      bracket.position.y = -0.03;
      addEdgeLines(bracket, '#4A90D9');
      group.add(bracket);

      return group;
    },
  },

  // ---- Fire Extinguisher ------------------------------------
  {
    id: 'fireExtinguisher',
    name: 'Fire Extinguisher',
    group: GROUP,
    description: 'FIA-mandated onboard fire suppression system — pressurised bottle with nozzles routed to the cockpit and engine bay. Can be triggered by the driver or externally via the rear crash structure "E" label.',
    assembledPosition: [-0.08, 0.14, -0.25],
    assembledRotation: [0, 0, 0],
    explosionDirection: [-0.5, 0.5, -0.3],
    build({ addEdgeLines }) {
      const group = new THREE.Group();

      // Main bottle (larger, red with emissive)
      const bottleGeo = new THREE.CylinderGeometry(0.032, 0.032, 0.20, 12);
      const bottle = new THREE.Mesh(bottleGeo, new THREE.MeshPhysicalMaterial({
        color: '#DD3333', metalness: 0.4, roughness: 0.3,
        emissive: '#DD3333', emissiveIntensity: 0.1,
        transparent: true, opacity: 0.92,
      }));
      bottle.castShadow = true;
      addEdgeLines(bottle, '#FF4444');
      group.add(bottle);

      // Dome top
      const domeGeo = new THREE.SphereGeometry(0.032, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2);
      const dome = new THREE.Mesh(domeGeo, new THREE.MeshPhysicalMaterial({
        color: '#DD3333', metalness: 0.4, roughness: 0.3,
        transparent: true, opacity: 0.92,
      }));
      dome.position.y = 0.10;
      group.add(dome);

      // Valve assembly
      const valveGeo = new THREE.CylinderGeometry(0.014, 0.016, 0.028, 8);
      const valve = new THREE.Mesh(valveGeo, mat({ metalness: 0.7 }));
      valve.position.y = 0.14;
      addEdgeLines(valve, '#4A90D9');
      group.add(valve);

      // Trigger pull handle (yellow)
      const handleGeo = new THREE.TorusGeometry(0.018, 0.003, 6, 12, Math.PI);
      const handle = new THREE.Mesh(handleGeo, new THREE.MeshPhysicalMaterial({
        color: '#FFDD00', metalness: 0.5, emissive: '#FFDD00', emissiveIntensity: 0.2,
        transparent: true, opacity: 0.95,
      }));
      handle.position.set(0, 0.15, 0.012);
      handle.rotation.x = Math.PI;
      group.add(handle);

      // Distribution tubes
      const nozzleCurve1 = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0.13, 0),
        new THREE.Vector3(0.03, 0.12, 0.03),
        new THREE.Vector3(0.07, 0.09, 0.05),
      ]);
      group.add(new THREE.Mesh(
        new THREE.TubeGeometry(nozzleCurve1, 8, 0.005, 6, false),
        mat({ metalness: 0.5 })
      ));

      const nozzleCurve2 = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0.13, 0),
        new THREE.Vector3(-0.03, 0.12, -0.03),
        new THREE.Vector3(-0.07, 0.09, -0.06),
      ]);
      group.add(new THREE.Mesh(
        new THREE.TubeGeometry(nozzleCurve2, 8, 0.005, 6, false),
        mat({ metalness: 0.5 })
      ));

      // Mounting clamp
      const clampGeo = new THREE.TorusGeometry(0.034, 0.004, 6, 16);
      const clamp = new THREE.Mesh(clampGeo, mat({ metalness: 0.6 }));
      clamp.position.y = -0.03;
      group.add(clamp);

      return group;
    },
  },
];
