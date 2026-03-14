// ============================================================
//  Interaction Manager — Raycasting, hover, click, UI wiring
// ============================================================

import * as THREE from 'three';
import TWEEN from '@tweenjs/tween.js';
import { CONFIG } from '../data/config.js';
import { COLORS } from '../data/colors.js';
import * as explosionManager from './explosionManager.js';

// ---- Module state -----------------------------------------
let scene, camera, renderer, controls;
let raycaster;
let pointer;
let interactiveMeshes = [];       // flat list of { partDef, mesh }
let meshToPartDef = new Map();    // mesh → partDef (for quick lookup)
let hoveredMesh = null;
let cachedRaycastTargets = null; // cached for performance
let pointerDownPos = null; // for drag detection

// Bound handler references (for cleanup in dispose)
const boundHandlers = {};

// ---- Initialization ---------------------------------------

/**
 * Initialises the interaction manager.
 * @param {THREE.Scene}        _scene
 * @param {THREE.Camera}       _camera
 * @param {THREE.WebGLRenderer}_renderer
 * @param {OrbitControls}      _controls
 */
function init(_scene, _camera, _renderer, _controls) {
  scene = _scene;
  camera = _camera;
  renderer = _renderer;
  controls = _controls;
  raycaster = new THREE.Raycaster();
  pointer = new THREE.Vector2(-9999, -9999); // off-screen initially

  // Bind event listeners
  boundHandlers.onPointerMove = onPointerMove.bind(null);
  boundHandlers.onPointerDown = onPointerDown.bind(null);
  boundHandlers.onClick = onClick.bind(null);
  boundHandlers.onGroupExploded = onGroupExploded.bind(null);
  boundHandlers.onGroupAssembled = onGroupAssembled.bind(null);

  renderer.domElement.addEventListener('pointermove', boundHandlers.onPointerMove);
  renderer.domElement.addEventListener('pointerdown', boundHandlers.onPointerDown);
  renderer.domElement.addEventListener('click', boundHandlers.onClick);
  document.addEventListener('group-exploded', boundHandlers.onGroupExploded);
  document.addEventListener('group-assembled', boundHandlers.onGroupAssembled);

  // Wire up legend panel buttons
  setupLegendButtons();
  setupActionButtons();
  setupDetailPanel();
}

// ---- Mesh registration ------------------------------------

/**
 * Registers an array of { partDef, mesh } objects as interactive.
 * Also collects all child meshes for raycasting.
 * @param {Array<{partDef: object, mesh: THREE.Object3D}>} meshes
 */
function registerMeshes(meshes) {
  interactiveMeshes = meshes;
  meshToPartDef.clear();
  cachedRaycastTargets = null; // invalidate cache

  for (const { partDef, mesh } of meshes) {
    mesh.userData.partDef = partDef;
    mesh.userData.isInteractive = true;

    mesh.traverse((child) => {
      if (child.isMesh) {
        meshToPartDef.set(child, partDef);
      }
    });
  }
}

// ---- Raycasting helpers -----------------------------------

/**
 * Collects all THREE.Mesh objects from registered interactive meshes
 * for the raycaster to test against.
 */
function getAllRaycastTargets() {
  if (cachedRaycastTargets) return cachedRaycastTargets;
  const targets = [];
  for (const { mesh } of interactiveMeshes) {
    mesh.traverse((child) => {
      if (child.isMesh) {
        targets.push(child);
      }
    });
  }
  cachedRaycastTargets = targets;
  return targets;
}

/**
 * Finds the partDef for a raycasted mesh by walking up its ancestry.
 */
function resolvePartDef(intersectedObj) {
  // Direct lookup first
  if (meshToPartDef.has(intersectedObj)) {
    return meshToPartDef.get(intersectedObj);
  }
  // Walk up the parent chain
  let current = intersectedObj;
  while (current) {
    if (current.userData && current.userData.partDef) {
      return current.userData.partDef;
    }
    current = current.parent;
  }
  return null;
}

/**
 * Finds the top-level interactive Object3D for a raycasted child mesh.
 */
function resolveInteractiveMesh(intersectedObj) {
  let current = intersectedObj;
  while (current) {
    if (current.userData && current.userData.isInteractive) {
      return current;
    }
    current = current.parent;
  }
  return null;
}

// ---- Hover styling ----------------------------------------

function applyHoverStyle(mesh) {
  mesh.traverse((child) => {
    if (child.isMesh && child.material) {
      const mat = child.material;
      child.userData._origEmissive = mat.emissive ? mat.emissive.getHex() : 0x000000;
      child.userData._origEmissiveIntensity = mat.emissiveIntensity || 0;
      child.userData._origOpacity = mat.opacity;

      if (mat.emissive) mat.emissive.set('#4A90D9');
      mat.emissiveIntensity = 0.3;
      if (mat.transparent) mat.opacity = 1.0;
    }
  });
  renderer.domElement.style.cursor = 'pointer';
}

function removeHoverStyle(mesh) {
  mesh.traverse((child) => {
    if (child.isMesh && child.material) {
      const mat = child.material;
      if (mat.emissive && child.userData._origEmissive !== undefined) {
        mat.emissive.setHex(child.userData._origEmissive);
      }
      if (child.userData._origEmissiveIntensity !== undefined) {
        mat.emissiveIntensity = child.userData._origEmissiveIntensity;
      }
      if (child.userData._origOpacity !== undefined && mat.transparent) {
        mat.opacity = child.userData._origOpacity;
      }
    }
  });
  renderer.domElement.style.cursor = 'default';
}

// ---- Event handlers ---------------------------------------

function onPointerMove(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(pointer, camera);
  const targets = getAllRaycastTargets();
  const intersects = raycaster.intersectObjects(targets, false);

  let newHovered = null;
  if (intersects.length > 0) {
    newHovered = resolveInteractiveMesh(intersects[0].object);
  }

  if (newHovered !== hoveredMesh) {
    if (hoveredMesh) removeHoverStyle(hoveredMesh);
    if (newHovered) applyHoverStyle(newHovered);
    hoveredMesh = newHovered;
  }
}

function onPointerDown(event) {
  pointerDownPos = { x: event.clientX, y: event.clientY };
}

function onClick(event) {
  // Ignore drag-style clicks (user was orbiting)
  if (pointerDownPos) {
    const dx = event.clientX - pointerDownPos.x;
    const dy = event.clientY - pointerDownPos.y;
    if (Math.sqrt(dx * dx + dy * dy) > 5) return;
  }

  raycaster.setFromCamera(pointer, camera);
  const targets = getAllRaycastTargets();
  const intersects = raycaster.intersectObjects(targets, false);

  if (intersects.length === 0) return;

  const hitMesh = resolveInteractiveMesh(intersects[0].object);
  const partDef = resolvePartDef(intersects[0].object);
  if (!partDef) return;

  const groupName = partDef.group;
  const state = explosionManager.getGroupState(groupName);

  if (state === 'ASSEMBLED') {
    // Click on assembled part → toggle its group
    explosionManager.toggleGroup(groupName);
  } else if (state === 'EXPLODED') {
    // Click on exploded part → show detail panel
    document.dispatchEvent(new CustomEvent('show-part-detail', {
      detail: { partDef, groupName },
    }));
  }
}

// ---- Legend panel wiring ----------------------------------

function setupLegendButtons() {
  const buttons = document.querySelectorAll('.group-btn');
  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const groupName = btn.getAttribute('data-group');
      if (!groupName) return;
      // Don't toggle CSS class here — let custom events drive it
      explosionManager.toggleGroup(groupName);
    });
  });
}

function setupActionButtons() {
  const explodeBtn = document.getElementById('btn-explode-all');
  const resetBtn = document.getElementById('btn-reset');

  if (explodeBtn) {
    explodeBtn.addEventListener('click', () => {
      explosionManager.explodeAll();
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      explosionManager.resetAll();
    });
  }
}

// ---- Detail panel -----------------------------------------

function setupDetailPanel() {
  const panel = document.getElementById('detail-panel');
  const closeBtn = document.getElementById('detail-close');

  if (closeBtn && panel) {
    closeBtn.addEventListener('click', () => {
      panel.classList.add('hidden');
    });
  }

  document.addEventListener('show-part-detail', (e) => {
    const { partDef, groupName } = e.detail;
    if (!panel) return;

    const nameEl = document.getElementById('detail-part-name');
    const systemEl = document.getElementById('detail-system-name');
    const descEl = document.getElementById('detail-description');
    const dotEl = panel.querySelector('.detail-dot');

    if (nameEl) nameEl.textContent = partDef.name;
    if (systemEl) {
      const groupMeta = CONFIG.groups[groupName];
      systemEl.textContent = groupMeta ? groupMeta.name : groupName;
    }
    if (descEl) descEl.textContent = partDef.description || '';
    if (dotEl) {
      dotEl.style.background = COLORS.groups[groupName] || COLORS.edge;
    }

    panel.classList.remove('hidden');
  });
}

// ---- Camera auto-frame on group explode -------------------

function onGroupExploded(e) {
  const { groupName } = e.detail;

  // Sync legend button active state
  const btn = document.querySelector(`.group-btn[data-group="${groupName}"]`);
  if (btn) btn.classList.add('active');

  if (!controls || !camera) return;

  const parts = explosionManager.getGroupParts(groupName);
  if (!parts || parts.length === 0) return;

  // Calculate bounding box of current (exploded) part positions
  const box = new THREE.Box3();
  for (const { mesh } of parts) {
    const worldPos = new THREE.Vector3();
    mesh.getWorldPosition(worldPos);

    // Expand box around mesh bounding box if available, else just position
    if (mesh.geometry && mesh.geometry.boundingBox) {
      const meshBox = mesh.geometry.boundingBox.clone();
      meshBox.translate(worldPos);
      box.union(meshBox);
    } else {
      box.expandByPoint(worldPos);
    }
  }

  // Pad the bounding box
  box.expandByScalar(0.5);

  const center = new THREE.Vector3();
  box.getCenter(center);

  const size = new THREE.Vector3();
  box.getSize(size);
  const maxDim = Math.max(size.x, size.y, size.z);

  // Camera offset: position at a comfortable viewing distance
  const fov = camera.fov * (Math.PI / 180);
  const dist = Math.max(maxDim / (2 * Math.tan(fov / 2)), 4);

  // Offset camera from center — keep a similar angle to current view
  const currentDir = new THREE.Vector3()
    .subVectors(camera.position, controls.target)
    .normalize();
  const targetCamPos = center.clone().add(currentDir.multiplyScalar(dist));

  // Tween camera position
  new TWEEN.Tween(camera.position)
    .to({ x: targetCamPos.x, y: targetCamPos.y, z: targetCamPos.z }, 800)
    .easing(TWEEN.Easing.Cubic.InOut)
    .start();

  // Tween orbit controls target
  new TWEEN.Tween(controls.target)
    .to({ x: center.x, y: center.y, z: center.z }, 800)
    .easing(TWEEN.Easing.Cubic.InOut)
    .start();
}

function onGroupAssembled(e) {
  const { groupName } = e.detail;

  // Sync legend button state
  const btn = document.querySelector(`.group-btn[data-group="${groupName}"]`);
  if (btn) btn.classList.remove('active');
}

// ---- Cleanup ----------------------------------------------

/**
 * Removes all event listeners. Call on teardown.
 */
function dispose() {
  if (renderer && renderer.domElement) {
    renderer.domElement.removeEventListener('pointermove', boundHandlers.onPointerMove);
    renderer.domElement.removeEventListener('pointerdown', boundHandlers.onPointerDown);
    renderer.domElement.removeEventListener('click', boundHandlers.onClick);
  }
  document.removeEventListener('group-exploded', boundHandlers.onGroupExploded);
  document.removeEventListener('group-assembled', boundHandlers.onGroupAssembled);
}

export { init, registerMeshes, dispose };
