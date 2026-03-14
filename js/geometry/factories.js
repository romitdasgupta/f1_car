// ============================================================
//  Higher-level geometry factories — produce THREE.Mesh / Group
// ============================================================

import * as THREE from 'three';

/**
 * Creates a wishbone (V-shape) from two thin tubes.
 * One leg runs from p1→p2, the other from p1→p3.
 *
 * @param {THREE.Vector3} p1     — Apex of the V (upright attachment)
 * @param {THREE.Vector3} p2     — Chassis mount point A
 * @param {THREE.Vector3} p3     — Chassis mount point B
 * @param {number}         radius — Tube radius
 * @returns {THREE.Group}
 */
export function createWishbone(p1, p2, p3, radius = 0.015) {
  const group = new THREE.Group();
  group.name = 'wishbone';

  const tubularSegments = 16;
  const radialSegments = 8;

  /**
   * Build a single leg from pA to pB with a very slight arc
   * to give the tube a natural look.
   */
  function makeLeg(pA, pB) {
    const mid = new THREE.Vector3().addVectors(pA, pB).multiplyScalar(0.5);
    // Offset midpoint slightly upward/outward for a gentle curve
    const dir = new THREE.Vector3().subVectors(pB, pA);
    const up = new THREE.Vector3(0, 1, 0);
    const offset = new THREE.Vector3().crossVectors(dir, up).normalize().multiplyScalar(0.02);
    mid.add(offset);
    mid.y += 0.01;

    const curve = new THREE.QuadraticBezierCurve3(pA, mid, pB);
    const geo = new THREE.TubeGeometry(curve, tubularSegments, radius, radialSegments, false);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x222222,
      metalness: 0.7,
      roughness: 0.3,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  const leg1 = makeLeg(p1, p2);
  leg1.name = 'wishbone_leg_1';
  group.add(leg1);

  const leg2 = makeLeg(p1, p3);
  leg2.name = 'wishbone_leg_2';
  group.add(leg2);

  return group;
}

/**
 * Creates a complete wheel corner — tire, rim, brake disc, and caliper.
 *
 * @param {number}          tireRadius — Outer radius of the tire torus
 * @param {number}          tireWidth  — Width of the tire (tube diameter ≈ width/2)
 * @param {THREE.Vector2[]} [rimProfile] — Optional LatheGeometry profile points
 * @returns {THREE.Group}
 */
export function createWheelAssembly(tireRadius = 0.33, tireWidth = 0.3, rimProfile) {
  const group = new THREE.Group();
  group.name = 'wheelAssembly';

  // ---- Tire (torus) ----------------------------------------
  const tubeRadius = tireWidth / 2;
  const tireGeo = new THREE.TorusGeometry(
    tireRadius,         // radius of the whole ring
    tubeRadius,         // tube radius
    24,                 // radial segments
    48                  // tubular segments
  );
  const tireMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    roughness: 0.9,
    metalness: 0.05,
  });
  const tire = new THREE.Mesh(tireGeo, tireMat);
  tire.name = 'tire';
  tire.castShadow = true;
  tire.receiveShadow = true;
  // Orient the torus so the wheel faces along the x-axis
  tire.rotation.y = Math.PI / 2;
  group.add(tire);

  // ---- Rim (lathe) -----------------------------------------
  const profile = rimProfile || defaultRimProfile(tireRadius, tubeRadius);
  const rimGeo = new THREE.LatheGeometry(profile, 32);
  const rimMat = new THREE.MeshStandardMaterial({
    color: 0xcccccc,
    metalness: 0.9,
    roughness: 0.15,
  });
  const rim = new THREE.Mesh(rimGeo, rimMat);
  rim.name = 'rim';
  rim.castShadow = true;
  rim.rotation.x = Math.PI / 2;
  group.add(rim);

  // ---- Brake disc ------------------------------------------
  const discRadius = tireRadius * 0.6;
  const discThickness = 0.025;
  const discGeo = new THREE.CylinderGeometry(
    discRadius, discRadius, discThickness, 36
  );
  const discMat = new THREE.MeshStandardMaterial({
    color: 0x888888,
    metalness: 0.8,
    roughness: 0.35,
  });
  const disc = new THREE.Mesh(discGeo, discMat);
  disc.name = 'brakeDisc';
  disc.rotation.x = Math.PI / 2;
  disc.castShadow = true;
  group.add(disc);

  // ---- Brake caliper ---------------------------------------
  const caliperWidth = discRadius * 0.35;
  const caliperHeight = discRadius * 0.25;
  const caliperDepth = discThickness * 3;
  const caliperGeo = new THREE.BoxGeometry(
    caliperWidth, caliperHeight, caliperDepth
  );
  const caliperMat = new THREE.MeshStandardMaterial({
    color: 0xcc0000,
    metalness: 0.5,
    roughness: 0.4,
  });
  const caliper = new THREE.Mesh(caliperGeo, caliperMat);
  caliper.name = 'brakeCaliper';
  // Position the caliper at the top of the disc
  caliper.position.set(0, discRadius * 0.85, 0);
  caliper.castShadow = true;
  group.add(caliper);

  return group;
}

/**
 * Generates a default spoked-style rim profile for LatheGeometry.
 *
 * @param {number} outerR — Outer radius matching tire inner edge
 * @param {number} tubeR  — Tire tube radius (for inset calculation)
 * @returns {THREE.Vector2[]}
 */
function defaultRimProfile(outerR, tubeR) {
  const innerR = outerR - tubeR;    // inner edge of tire
  const hubR = outerR * 0.18;       // small centre hub
  const lipR = innerR + 0.005;      // slight lip beyond inner tire
  const depth = tubeR * 0.55;       // how deep the rim well sits

  return [
    new THREE.Vector2(hubR, -depth * 0.3),
    new THREE.Vector2(hubR, depth * 0.3),
    new THREE.Vector2(hubR + 0.01, depth * 0.35),
    // spoke region — gently expand outward
    new THREE.Vector2(innerR * 0.4, depth * 0.3),
    new THREE.Vector2(innerR * 0.7, depth * 0.15),
    // rim well
    new THREE.Vector2(innerR * 0.92, depth * 0.05),
    new THREE.Vector2(innerR, 0),
    // outer lip
    new THREE.Vector2(lipR, -depth * 0.1),
    new THREE.Vector2(lipR, depth * 0.1),
    new THREE.Vector2(innerR, 0),
    // inner side mirror
    new THREE.Vector2(innerR * 0.92, -depth * 0.05),
    new THREE.Vector2(innerR * 0.7, -depth * 0.15),
    new THREE.Vector2(innerR * 0.4, -depth * 0.3),
    new THREE.Vector2(hubR + 0.01, -depth * 0.35),
    new THREE.Vector2(hubR, -depth * 0.3),
  ];
}

/**
 * Creates a turbo section (compressor or turbine) using LatheGeometry.
 *
 * 'compressor' — bell-shaped, expanding from inlet to outlet
 * 'turbine'    — inverse bell, contracting from inlet to outlet
 *
 * @param {'compressor'|'turbine'} type
 * @returns {THREE.Mesh}
 */
export function createTurboSection(type = 'compressor') {
  const points = [];
  const segments = 32;
  const length = 0.25;    // axial length
  const inletR = 0.04;    // small end radius
  const outletR = 0.12;   // large end radius

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const y = t * length;

    // Bell curve: radius expands (compressor) or contracts (turbine)
    let radius;
    if (type === 'compressor') {
      // Starts small, expands with bell shape
      const curve = Math.pow(t, 0.6);
      radius = inletR + (outletR - inletR) * curve;
    } else {
      // Starts large, contracts with bell shape
      const curve = Math.pow(1 - t, 0.6);
      radius = inletR + (outletR - inletR) * curve;
    }

    points.push(new THREE.Vector2(radius, y));
  }

  // Add end caps — close off the profile for a solid look
  if (type === 'compressor') {
    // Flat cap at the wide end
    points.push(new THREE.Vector2(outletR * 0.7, length));
    // Inner bore at wide end
    points.push(new THREE.Vector2(inletR * 0.8, length));
  } else {
    // Flat cap at the narrow end
    points.push(new THREE.Vector2(inletR * 0.9, length));
    // Inner bore at narrow end
    points.push(new THREE.Vector2(inletR * 0.6, length));
  }

  const geo = new THREE.LatheGeometry(points, 48);
  const mat = new THREE.MeshStandardMaterial({
    color: type === 'compressor' ? 0x7799AA : 0xAA6644,
    metalness: 0.85,
    roughness: 0.2,
    side: THREE.DoubleSide,
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = type === 'compressor' ? 'turbo_compressor' : 'turbo_turbine';
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  return mesh;
}

/**
 * Adds stylised edge lines to a mesh.
 * Creates EdgesGeometry, wraps in LineSegments with LineBasicMaterial,
 * and attaches as a child of the mesh.
 *
 * @param {THREE.Mesh} mesh            — The mesh to decorate
 * @param {string}     color           — CSS colour string
 * @param {number}     thresholdAngle  — Angle threshold (degrees) for edge detection
 * @returns {THREE.Mesh} — The same mesh (mutated)
 */
export function addEdgeLines(mesh, color = '#4A90D9', thresholdAngle = 15) {
  const edgesGeo = new THREE.EdgesGeometry(mesh.geometry, thresholdAngle);
  const linesMat = new THREE.LineBasicMaterial({
    color: new THREE.Color(color),
    transparent: true,
    opacity: 0.6,
  });
  const lines = new THREE.LineSegments(edgesGeo, linesMat);
  lines.name = 'edgeLines';
  // Prevent edge lines from interfering with raycasting
  lines.raycast = () => {};
  mesh.add(lines);
  return mesh;
}
