// ============================================================
//  Label Manager — CSS2D labels with connection lines
// ============================================================

import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { COLORS } from '../data/colors.js';
import { CONFIG } from '../data/config.js';

// ---- Internal storage -------------------------------------

// groupName → [{ partDef, mesh, label, line, anchor }]
const labelData = new Map();

// All labels flat list (for overlap avoidance)
let allLabels = [];

// Reference to the scene
let sceneRef = null;

// ---- Label creation ---------------------------------------

/**
 * Creates CSS2DObject labels and connection lines for all registered parts.
 * Labels start hidden and are revealed when their group explodes.
 *
 * @param {Array<{partDef: object, mesh: THREE.Object3D}>} partsWithMeshes
 * @param {THREE.Scene} scene
 */
function createLabels(partsWithMeshes, scene) {
  sceneRef = scene;
  allLabels = [];

  for (const { partDef, mesh } of partsWithMeshes) {
    const groupName = partDef.group;
    const groupColor = COLORS.groups[groupName] || COLORS.edge;

    // ---- Create the label DOM element ----
    const div = document.createElement('div');
    div.className = 'tooltip-label';
    div.textContent = partDef.name;
    div.style.borderLeft = `3px solid ${groupColor}`;
    div.style.opacity = '0';
    div.style.transition = 'opacity 0.3s ease';
    div.style.pointerEvents = 'none';

    const label = new CSS2DObject(div);

    // Position label slightly offset from mesh center to avoid overlap
    // Use a deterministic offset based on part id hash
    const offsetY = 0.3 + (partDef.id.length % 5) * 0.05;
    const offsetX = ((partDef.id.charCodeAt(0) % 3) - 1) * 0.15;
    label.position.set(offsetX, offsetY, 0);

    label.visible = false;
    mesh.add(label);

    // ---- Create connection line (mesh-center to label anchor) ----
    const lineGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(6); // 2 points x 3 components
    lineGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const lineMaterial = new THREE.LineBasicMaterial({
      color: new THREE.Color(groupColor),
      transparent: true,
      opacity: 0,
      depthTest: false,
    });

    const line = new THREE.Line(lineGeometry, lineMaterial);
    line.renderOrder = 999;
    line.visible = false;
    mesh.add(line);

    // Store entry
    const entry = { partDef, mesh, label, line, div };

    if (!labelData.has(groupName)) {
      labelData.set(groupName, []);
    }
    labelData.get(groupName).push(entry);
    allLabels.push(entry);
  }
}

// ---- Show / hide labels for a group -----------------------

/**
 * Shows labels for the given group with a fade-in effect.
 * @param {string} groupName
 */
function showGroupLabels(groupName) {
  const entries = labelData.get(groupName);
  if (!entries) return;

  entries.forEach((entry, index) => {
    const { label, line, div } = entry;
    label.visible = true;
    line.visible = true;

    // Stagger the fade-in slightly
    setTimeout(() => {
      div.style.opacity = '1';
      line.material.opacity = 0.5;
    }, index * 30);
  });
}

/**
 * Hides labels for the given group with a fade-out effect.
 * @param {string} groupName
 */
function hideGroupLabels(groupName) {
  const entries = labelData.get(groupName);
  if (!entries) return;

  entries.forEach((entry) => {
    const { label, line, div } = entry;
    div.style.opacity = '0';
    line.material.opacity = 0;

    // After transition, hide the CSS2D objects
    setTimeout(() => {
      label.visible = false;
      line.visible = false;
    }, 350);
  });
}

/**
 * Hides all labels across all groups.
 */
function hideAllLabels() {
  for (const groupName of labelData.keys()) {
    hideGroupLabels(groupName);
  }
}

// ---- Per-frame update -------------------------------------

/**
 * Called each frame. Updates connection line positions and
 * adjusts label opacity based on camera distance.
 *
 * @param {THREE.Camera} camera
 */
function updateLabels(camera) {
  if (allLabels.length === 0) return;

  const cameraPos = camera.position;
  const screenPositions = []; // for overlap avoidance

  for (const entry of allLabels) {
    const { mesh, label, line, div } = entry;

    if (!label.visible) continue;

    // ---- Update connection line ----
    // Line goes from local origin (mesh center) to label position (in mesh local space)
    const positions = line.geometry.attributes.position;
    if (positions) {
      // Start: mesh-local origin
      positions.setXYZ(0, 0, 0, 0);
      // End: label position in mesh-local space
      positions.setXYZ(1, label.position.x, label.position.y, label.position.z);
      positions.needsUpdate = true;
    }

    // ---- Distance-based opacity ----
    const meshWorldPos = new THREE.Vector3();
    mesh.getWorldPosition(meshWorldPos);
    const dist = cameraPos.distanceTo(meshWorldPos);

    // Closer → more opaque, farther → less
    // Range: fully opaque within 5 units, fading to 0.3 at 20 units
    const opacity = THREE.MathUtils.clamp(
      THREE.MathUtils.mapLinear(dist, 5, 20, 1.0, 0.3),
      0.3,
      1.0
    );

    if (div.style.opacity !== '0') {
      div.style.opacity = String(opacity);
      line.material.opacity = opacity * 0.5;
    }

    // ---- Collect screen positions for overlap avoidance ----
    const screenPos = meshWorldPos.clone().project(camera);
    screenPositions.push({ entry, screenPos });
  }

  // ---- Simple overlap avoidance ----
  // If two labels are close in screen space, nudge Y
  for (let i = 0; i < screenPositions.length; i++) {
    for (let j = i + 1; j < screenPositions.length; j++) {
      const a = screenPositions[i];
      const b = screenPositions[j];

      if (!a.entry.label.visible || !b.entry.label.visible) continue;

      const dx = a.screenPos.x - b.screenPos.x;
      const dy = a.screenPos.y - b.screenPos.y;
      const screenDist = Math.sqrt(dx * dx + dy * dy);

      // If labels are very close in screen space, nudge them apart in world space
      if (screenDist < 0.06) {
        const nudge = 0.12;
        b.entry.label.position.y += nudge;
      }
    }
  }
}

// ---- Wire custom events -----------------------------------

// Auto-show labels when a group explodes, hide when reassembled
document.addEventListener('group-exploded', (e) => {
  showGroupLabels(e.detail.groupName);
});

document.addEventListener('group-assembled', (e) => {
  hideGroupLabels(e.detail.groupName);
});

export {
  createLabels,
  showGroupLabels,
  hideGroupLabels,
  hideAllLabels,
  updateLabels,
};
