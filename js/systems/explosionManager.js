// ============================================================
//  Explosion Manager — State machine + explode/reassemble logic
// ============================================================

import TWEEN from '@tweenjs/tween.js';
import { CONFIG } from '../data/config.js';

// ---- State enum -------------------------------------------
const State = Object.freeze({
  ASSEMBLED:     'ASSEMBLED',
  EXPLODING:     'EXPLODING',
  EXPLODED:      'EXPLODED',
  REASSEMBLING:  'REASSEMBLING',
});

// ---- Per-group storage ------------------------------------
// groupName → [{ partDef, mesh, assembledPos, assembledRot }]
const groups = new Map();

// groupName → State
const groupStates = new Map();

// groupName → centroid (THREE.Vector3) — cached on first explode
const groupCentroids = new Map();

// ---- Helpers: vectors (avoid importing THREE just for math) --
function vec3(x, y, z) {
  return { x, y, z };
}

function addVec(a, b) {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

function subVec(a, b) {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

function scaleVec(v, s) {
  return { x: v.x * s, y: v.y * s, z: v.z * s };
}

function lenVec(v) {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
}

function normVec(v) {
  const l = lenVec(v) || 1;
  return { x: v.x / l, y: v.y / l, z: v.z / l };
}

// ---- Registration -----------------------------------------

/**
 * Registers a part and its mesh with its group.
 * @param {object}     partDef — Part definition (id, group, assembledPosition, explosionDirection, …)
 * @param {THREE.Object3D} mesh — The built mesh / group placed in the scene
 */
function registerPart(partDef, mesh) {
  const groupName = partDef.group;
  if (!groups.has(groupName)) {
    groups.set(groupName, []);
    groupStates.set(groupName, State.ASSEMBLED);
  }
  groups.get(groupName).push({
    partDef,
    mesh,
    assembledPos: vec3(
      mesh.position.x,
      mesh.position.y,
      mesh.position.z
    ),
    assembledRot: vec3(
      mesh.rotation.x,
      mesh.rotation.y,
      mesh.rotation.z
    ),
  });
}

// ---- Centroid calculation ----------------------------------

function computeCentroid(groupName) {
  if (groupCentroids.has(groupName)) return groupCentroids.get(groupName);

  const parts = groups.get(groupName);
  if (!parts || parts.length === 0) return vec3(0, 0, 0);

  let cx = 0, cy = 0, cz = 0;
  for (const { assembledPos } of parts) {
    cx += assembledPos.x;
    cy += assembledPos.y;
    cz += assembledPos.z;
  }
  const n = parts.length;
  const centroid = vec3(cx / n, cy / n, cz / n);
  groupCentroids.set(groupName, centroid);
  return centroid;
}

// ---- Exploded position calculation -------------------------

/**
 * Calculates the target position for a part when exploded.
 * direction = normalize(assembledPosition - groupCentroid) * 0.4 + explosionDirection * 0.6
 * distance  = CONFIG.explosion.distances[group]
 * final     = assembledPosition + normalize(direction) * distance
 */
function calculateExplodedPosition(partDef, assembledPos, groupCentroid) {
  const groupName = partDef.group;
  const distance = CONFIG.explosion.distances[groupName] || 2.0;

  // Direction from centroid to part
  const fromCentroid = normVec(subVec(assembledPos, groupCentroid));

  // Explicit explosion direction from partDef
  const expDir = partDef.explosionDirection
    ? normVec(vec3(
        partDef.explosionDirection[0],
        partDef.explosionDirection[1],
        partDef.explosionDirection[2]
      ))
    : fromCentroid;

  // Blend: 40% centroid-based, 60% explicit direction
  const blended = addVec(
    scaleVec(fromCentroid, 0.4),
    scaleVec(expDir, 0.6)
  );
  const dir = normVec(blended);

  return addVec(assembledPos, scaleVec(dir, distance));
}

// ---- Dispatch helper --------------------------------------

function dispatch(eventName, detail) {
  document.dispatchEvent(new CustomEvent(eventName, { detail }));
}

// ---- Explode a group --------------------------------------

/**
 * Explodes a single group with staggered tweens.
 * @param {string} groupName
 * @returns {Promise<void>}
 */
function explodeGroup(groupName) {
  const state = groupStates.get(groupName);
  if (!state || state === State.EXPLODING || state === State.EXPLODED) {
    return Promise.resolve();
  }

  groupStates.set(groupName, State.EXPLODING);

  const parts = groups.get(groupName);
  if (!parts || parts.length === 0) {
    groupStates.set(groupName, State.ASSEMBLED);
    return Promise.resolve();
  }

  const centroid = computeCentroid(groupName);
  const duration = CONFIG.animation.explodeDuration;
  const stagger = CONFIG.animation.staggerDelay;

  // Sort parts by distance from centroid (closest first → they pop outward in sequence)
  const sorted = [...parts].sort((a, b) => {
    const da = lenVec(subVec(a.assembledPos, centroid));
    const db = lenVec(subVec(b.assembledPos, centroid));
    return da - db;
  });

  return new Promise((resolve) => {
    let completed = 0;

    sorted.forEach((entry, index) => {
      const { partDef, mesh, assembledPos } = entry;
      const target = calculateExplodedPosition(partDef, assembledPos, centroid);

      const tween = new TWEEN.Tween(mesh.position)
        .to({ x: target.x, y: target.y, z: target.z }, duration)
        .easing(TWEEN.Easing.Back.Out)
        .delay(index * stagger)
        .onComplete(() => {
          dispatch('part-exploded', { partDef, groupName });
          completed++;
          if (completed === sorted.length) {
            groupStates.set(groupName, State.EXPLODED);
            dispatch('group-exploded', { groupName });
            resolve();
          }
        })
        .start();
    });
  });
}

// ---- Reassemble a group -----------------------------------

/**
 * Reassembles a single group — tweens all parts back to assembled positions.
 * @param {string} groupName
 * @returns {Promise<void>}
 */
function reassembleGroup(groupName) {
  const state = groupStates.get(groupName);
  if (!state || state === State.REASSEMBLING || state === State.ASSEMBLED) {
    return Promise.resolve();
  }

  groupStates.set(groupName, State.REASSEMBLING);

  const parts = groups.get(groupName);
  if (!parts || parts.length === 0) {
    groupStates.set(groupName, State.ASSEMBLED);
    return Promise.resolve();
  }

  const duration = CONFIG.animation.reassembleDuration;

  return new Promise((resolve) => {
    let completed = 0;

    parts.forEach((entry) => {
      const { mesh, assembledPos } = entry;

      new TWEEN.Tween(mesh.position)
        .to({ x: assembledPos.x, y: assembledPos.y, z: assembledPos.z }, duration)
        .easing(TWEEN.Easing.Cubic.InOut)
        .onComplete(() => {
          completed++;
          if (completed === parts.length) {
            groupStates.set(groupName, State.ASSEMBLED);
            dispatch('group-assembled', { groupName });
            resolve();
          }
        })
        .start();
    });
  });
}

// ---- Toggle -----------------------------------------------

/**
 * Toggles a group between assembled and exploded.
 * If currently animating, the request is ignored (edge-case guard).
 * @param {string} groupName
 * @returns {Promise<void>}
 */
function toggleGroup(groupName) {
  const state = groupStates.get(groupName);
  if (state === State.ASSEMBLED) return explodeGroup(groupName);
  if (state === State.EXPLODED) return reassembleGroup(groupName);
  // Ignore if mid-animation
  return Promise.resolve();
}

// ---- Explode all ------------------------------------------

const CASCADE_ORDER = [
  'aerodynamics',
  'suspension',
  'wheelsAndBrakes',
  'chassis',
  'steering',
  'powerUnit',
  'drivetrain',
];

/**
 * Cascaded explosion of all groups, front-to-rear.
 * @returns {Promise<void>}
 */
async function explodeAll() {
  const delay = CONFIG.animation.cascadeDelay;

  for (let i = 0; i < CASCADE_ORDER.length; i++) {
    const groupName = CASCADE_ORDER[i];
    if (groups.has(groupName)) {
      // Fire each group with a cascade delay — don't await each one;
      // instead, delay the start and let them overlap
      setTimeout(() => explodeGroup(groupName), i * delay);
    }
  }
}

// ---- Reset all --------------------------------------------

/**
 * Reassembles every group immediately (no cascade).
 * @returns {Promise<void[]>}
 */
function resetAll() {
  const promises = [];
  for (const groupName of groups.keys()) {
    promises.push(reassembleGroup(groupName));
  }
  return Promise.all(promises);
}

// ---- State query ------------------------------------------

/**
 * Returns the current state of a group.
 * @param {string} groupName
 * @returns {string} One of State values, or undefined
 */
function getGroupState(groupName) {
  return groupStates.get(groupName);
}

/**
 * Returns the parts registered for a group.
 * @param {string} groupName
 * @returns {Array|undefined}
 */
function getGroupParts(groupName) {
  return groups.get(groupName);
}

/**
 * Returns all registered group names.
 * @returns {string[]}
 */
function getGroupNames() {
  return [...groups.keys()];
}

export {
  State,
  registerPart,
  explodeGroup,
  reassembleGroup,
  toggleGroup,
  explodeAll,
  resetAll,
  getGroupState,
  getGroupParts,
  getGroupNames,
  calculateExplodedPosition,
};
