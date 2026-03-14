// ============================================================
//  Shape profile factories — return THREE.Shape objects
//  for use with ExtrudeGeometry
// ============================================================

import * as THREE from 'three';

/**
 * Creates a NACA-style airfoil profile.
 * Leading edge is rounded, trailing edge tapers to a point.
 *
 * @param {number} chord     — Total chord length (x-axis extent)
 * @param {number} thickness — Maximum thickness as a fraction of chord (0–1)
 * @param {number} camber    — Maximum camber as a fraction of chord (0–1)
 * @returns {THREE.Shape}
 */
export function createAirfoilShape(chord = 1.0, thickness = 0.12, camber = 0.04) {
  const shape = new THREE.Shape();
  const halfT = thickness * chord * 0.5;
  const camberPeak = camber * chord;
  const steps = 40;

  // Build upper surface points (leading edge → trailing edge)
  const upper = [];
  const lower = [];

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = t * chord;

    // NACA 4-digit thickness distribution (simplified)
    const xt = t;
    const yt =
      5 *
      thickness *
      chord *
      (0.2969 * Math.sqrt(xt) -
        0.126 * xt -
        0.3516 * xt * xt +
        0.2843 * xt * xt * xt -
        0.1015 * xt * xt * xt * xt);

    // Camber line — parabolic arc peaking at 40% chord
    const camberY =
      t <= 0.4
        ? camberPeak * (t / 0.16) * (0.8 - t)
        : camberPeak * ((1 - t) / 0.36) * (t - 0.2);

    upper.push(new THREE.Vector2(x, camberY + yt));
    lower.push(new THREE.Vector2(x, camberY - yt));
  }

  // Start at trailing edge lower surface
  shape.moveTo(lower[lower.length - 1].x, lower[lower.length - 1].y);

  // Lower surface: trailing edge → leading edge (reversed)
  for (let i = lower.length - 2; i >= 0; i--) {
    shape.lineTo(lower[i].x, lower[i].y);
  }

  // Rounded leading edge via quadratic curve
  shape.quadraticCurveTo(
    -halfT * 0.3,        // control point slightly ahead of LE
    0,                    // centred vertically
    upper[0].x,
    upper[0].y
  );

  // Upper surface: leading edge → trailing edge
  for (let i = 1; i < upper.length; i++) {
    shape.lineTo(upper[i].x, upper[i].y);
  }

  // Close at trailing edge
  shape.lineTo(lower[lower.length - 1].x, lower[lower.length - 1].y);

  return shape;
}

/**
 * Creates a tapered F1 monocoque cross-section.
 * Wider at the bottom, narrower at the top, with rounded corners.
 *
 * @param {number} width  — Width at the widest point (bottom)
 * @param {number} height — Total height
 * @returns {THREE.Shape}
 */
export function createMonocoqueShape(width = 0.55, height = 0.45) {
  const shape = new THREE.Shape();

  const halfW = width / 2;
  const topHalfW = halfW * 0.6;   // top is narrower
  const r = 0.06;                  // corner radius

  // Start bottom-left (inside left radius)
  shape.moveTo(-halfW + r, 0);

  // Bottom edge
  shape.lineTo(halfW - r, 0);

  // Bottom-right corner
  shape.quadraticCurveTo(halfW, 0, halfW, r);

  // Right side — tapers inward toward top
  shape.lineTo(topHalfW, height - r);

  // Top-right corner
  shape.quadraticCurveTo(topHalfW, height, topHalfW - r, height);

  // Top edge
  shape.lineTo(-topHalfW + r, height);

  // Top-left corner
  shape.quadraticCurveTo(-topHalfW, height, -topHalfW, height - r);

  // Left side — tapers outward toward bottom
  shape.lineTo(-halfW, r);

  // Bottom-left corner
  shape.quadraticCurveTo(-halfW, 0, -halfW + r, 0);

  return shape;
}

/**
 * Creates a bucket seat profile.
 * Curved back, flat base, raised side bolsters.
 *
 * @param {number} width  — Seat width
 * @param {number} height — Seat back height
 * @returns {THREE.Shape}
 */
export function createSeatShape(width = 0.44, height = 0.55) {
  const shape = new THREE.Shape();

  const halfW = width / 2;
  const bolsterH = height * 0.65;   // side bolster height
  const bolsterW = halfW * 0.18;    // bolster thickness
  const baseY = 0;
  const backCurve = 0.06;           // depth of curve in seat back

  // Start at bottom-left of seat base
  shape.moveTo(-halfW, baseY);

  // Flat base
  shape.lineTo(halfW, baseY);

  // Right side up to right bolster
  shape.lineTo(halfW, bolsterH * 0.25);

  // Right bolster — side wall bulges outward
  shape.quadraticCurveTo(
    halfW + bolsterW, bolsterH * 0.55,
    halfW, bolsterH
  );

  // Right bolster up to top of seat back
  shape.lineTo(halfW * 0.7, height * 0.9);

  // Top of seat back — gentle curve
  shape.quadraticCurveTo(
    backCurve, height + backCurve,
    -halfW * 0.7, height * 0.9
  );

  // Left bolster — top to partway down
  shape.lineTo(-halfW, bolsterH);

  // Left bolster — side wall bulges outward
  shape.quadraticCurveTo(
    -halfW - bolsterW, bolsterH * 0.55,
    -halfW, bolsterH * 0.25
  );

  // Close back to start
  shape.lineTo(-halfW, baseY);

  return shape;
}
