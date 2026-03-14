// ============================================================
//  F1 CAR // MECHANICAL BREAKOUT — Scene bootstrap
// ============================================================

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import TWEEN from '@tweenjs/tween.js';
import { COLORS } from './data/colors.js';
import { CONFIG } from './data/config.js';

// ---- Part definitions ----------------------------------------
import { chassisParts } from './parts/chassis.js';
import { powerUnitParts } from './parts/powerUnit.js';
import { drivetrainParts } from './parts/drivetrain.js';
import { aerodynamicsParts } from './parts/aerodynamics.js';
import { suspensionParts } from './parts/suspension.js';
import { wheelsAndBrakesParts } from './parts/wheelsAndBrakes.js';
import { steeringAndDriverParts } from './parts/steeringAndDriver.js';

// ---- Geometry factories --------------------------------------
import { createAirfoilShape, createMonocoqueShape, createSeatShape } from './geometry/shapes.js';
import { createWishbone, createWheelAssembly, createTurboSection, addEdgeLines } from './geometry/factories.js';

// ---- System managers -----------------------------------------
import * as explosionManager from './systems/explosionManager.js';
import * as interactionManager from './systems/interactionManager.js';
import * as labelManager from './systems/labelManager.js';
import * as animationManager from './systems/animationManager.js';

// ---- Scene ------------------------------------------------
const scene = new THREE.Scene();
scene.background = new THREE.Color(COLORS.background);

// ---- Camera -----------------------------------------------
const camera = new THREE.PerspectiveCamera(
  CONFIG.camera.fov,
  window.innerWidth / window.innerHeight,
  0.1,
  200
);
camera.position.set(
  CONFIG.camera.position[0],
  CONFIG.camera.position[1],
  CONFIG.camera.position[2]
);
camera.lookAt(
  CONFIG.camera.target[0],
  CONFIG.camera.target[1],
  CONFIG.camera.target[2]
);

// ---- WebGL Renderer ---------------------------------------
const canvas = document.getElementById('three-canvas');
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true,
});
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// ---- CSS2D Renderer ---------------------------------------
const css2DRenderer = new CSS2DRenderer();
css2DRenderer.setSize(window.innerWidth, window.innerHeight);
css2DRenderer.domElement.style.position = 'absolute';
css2DRenderer.domElement.style.top = '0';
css2DRenderer.domElement.style.left = '0';
css2DRenderer.domElement.style.pointerEvents = 'none';

const css2dContainer = document.getElementById('css2d-container');
css2dContainer.appendChild(css2DRenderer.domElement);

// ---- Orbit Controls ---------------------------------------
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 3;
controls.maxDistance = 25;
controls.target.set(
  CONFIG.camera.target[0],
  CONFIG.camera.target[1],
  CONFIG.camera.target[2]
);

// ---- Lights -----------------------------------------------

// 1. Ambient — cool blue tint, low intensity
const ambientLight = new THREE.AmbientLight(0x4466AA, 0.35);
scene.add(ambientLight);

// 2. Key directional — warm white, casts shadows
const keyLight = new THREE.DirectionalLight(0xFFF4E0, 1.6);
keyLight.position.set(5, 10, 7);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(2048, 2048);
keyLight.shadow.camera.near = 0.5;
keyLight.shadow.camera.far = 50;
keyLight.shadow.camera.left = -10;
keyLight.shadow.camera.right = 10;
keyLight.shadow.camera.top = 10;
keyLight.shadow.camera.bottom = -10;
keyLight.shadow.bias = -0.0001;
scene.add(keyLight);

// 3. Blue rim light from behind
const rimLight = new THREE.DirectionalLight(0x4A90D9, 0.8);
rimLight.position.set(-5, 4, -8);
scene.add(rimLight);

// 4. Hemisphere — sky blue top, dark ground
const hemiLight = new THREE.HemisphereLight(0x6688CC, 0x0A0E17, 0.4);
scene.add(hemiLight);

// ---- Ground grid (custom ShaderMaterial) ------------------
const gridSize = 60;
const gridGeometry = new THREE.PlaneGeometry(gridSize, gridSize);

const gridMaterial = new THREE.ShaderMaterial({
  transparent: true,
  uniforms: {
    uGridColor: { value: new THREE.Color(COLORS.grid) },
    uBgColor:   { value: new THREE.Color(COLORS.background) },
    uGridSize:  { value: gridSize },
    uCellSize:  { value: 1.0 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform vec3 uGridColor;
    uniform vec3 uBgColor;
    uniform float uGridSize;
    uniform float uCellSize;
    varying vec2 vUv;

    void main() {
      vec2 worldPos = (vUv - 0.5) * uGridSize;
      vec2 grid = abs(fract(worldPos / uCellSize - 0.5) - 0.5) / fwidth(worldPos / uCellSize);
      float line = min(grid.x, grid.y);
      float alpha = 1.0 - min(line, 1.0);

      // fade out toward edges
      float dist = length(worldPos) / (uGridSize * 0.5);
      float fade = 1.0 - smoothstep(0.5, 1.0, dist);

      vec3 color = mix(uBgColor, uGridColor, alpha);
      gl_FragColor = vec4(color, alpha * fade * 0.7);
    }
  `,
  depthWrite: false,
});

const gridMesh = new THREE.Mesh(gridGeometry, gridMaterial);
gridMesh.rotation.x = -Math.PI / 2;
gridMesh.position.y = -0.01;         // just below y = 0
gridMesh.receiveShadow = true;
scene.add(gridMesh);

// ---- Build the F1 car -------------------------------------
const allPartDefs = [
  ...chassisParts, ...powerUnitParts, ...drivetrainParts,
  ...aerodynamicsParts, ...suspensionParts, ...wheelsAndBrakesParts,
  ...steeringAndDriverParts
];

const factories = {
  createAirfoilShape, createMonocoqueShape, createSeatShape,
  createWishbone, createWheelAssembly, createTurboSection, addEdgeLines
};

const builtParts = []; // array of { partDef, mesh }

for (const partDef of allPartDefs) {
  const mesh = partDef.build(factories);
  mesh.position.set(...partDef.assembledPosition);
  if (partDef.assembledRotation) {
    mesh.rotation.set(...partDef.assembledRotation);
  }
  mesh.userData.partDef = partDef;
  scene.add(mesh);
  builtParts.push({ partDef, mesh });
}

// ---- Register with systems ----------------------------------

// Register each part with explosion manager
for (const { partDef, mesh } of builtParts) {
  explosionManager.registerPart(partDef, mesh);
}

// Initialize interaction manager
interactionManager.init(scene, camera, renderer, controls);
interactionManager.registerMeshes(builtParts);

// Create labels
labelManager.createLabels(builtParts, scene);

// ---- Hide loading overlay -----------------------------------
const loadingOverlay = document.getElementById('loading-overlay');
if (loadingOverlay) {
  loadingOverlay.classList.add('fade-out');
  loadingOverlay.addEventListener('transitionend', () => {
    loadingOverlay.remove();
  });
}

// ---- Animation loop ---------------------------------------
function animate(time) {
  requestAnimationFrame(animate);
  animationManager.update(time);
  controls.update();
  renderer.render(scene, camera);
  css2DRenderer.render(scene, camera);
  labelManager.updateLabels(camera);
}
animate(0);

// ---- Resize handler ---------------------------------------
window.addEventListener('resize', () => {
  const w = window.innerWidth;
  const h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  css2DRenderer.setSize(w, h);
});

// ---- Exports for other modules ----------------------------
export { scene, camera, renderer, css2DRenderer, controls, TWEEN };
