// ============================================================
//  Animation Manager — Tween management wrapper around TWEEN
// ============================================================

import TWEEN from '@tweenjs/tween.js';

// Independent TWEEN.Groups keyed by name
const tweenGroups = new Map();

/**
 * Gets an existing TWEEN.Group or creates a new one.
 * @param {string} groupName
 * @returns {TWEEN.Group}
 */
function getOrCreateGroup(groupName) {
  if (!tweenGroups.has(groupName)) {
    tweenGroups.set(groupName, new TWEEN.Group());
  }
  return tweenGroups.get(groupName);
}

/**
 * Stops (and removes) all tweens in a named group.
 * @param {string} groupName
 */
function stopGroup(groupName) {
  const group = tweenGroups.get(groupName);
  if (group) {
    group.removeAll();
  }
}

/**
 * Creates and immediately starts a tween.
 *
 * @param {object}   target      — The object whose properties will be tweened
 * @param {object}   to          — Target property values
 * @param {number}   duration    — Duration in ms
 * @param {Function} [easing]    — TWEEN easing function (default: Quadratic.InOut)
 * @param {Function} [onUpdate]  — Called each frame with the tweened object
 * @param {Function} [onComplete]— Called when the tween finishes
 * @param {string}   [groupName] — Optional group name for independent control
 * @returns {TWEEN.Tween}
 */
function createTween(
  target,
  to,
  duration,
  easing = TWEEN.Easing.Quadratic.InOut,
  onUpdate,
  onComplete,
  groupName
) {
  const group = groupName ? getOrCreateGroup(groupName) : undefined;
  const tween = new TWEEN.Tween(target, group)
    .to(to, duration)
    .easing(easing);

  if (onUpdate) tween.onUpdate(onUpdate);
  if (onComplete) tween.onComplete(onComplete);

  tween.start();
  return tween;
}

/**
 * Updates the global TWEEN clock and all named groups.
 * Call once per frame from the animation loop.
 * @param {number} time — Typically performance.now() or the rAF timestamp
 */
function update(time) {
  TWEEN.update(time);
  for (const group of tweenGroups.values()) {
    group.update(time);
  }
}

export { createTween, tweenGroups, getOrCreateGroup, stopGroup, update };
