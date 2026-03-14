// ============================================================
//  Configuration — animation, camera, group metadata
// ============================================================

export const CONFIG = {

  // Explosion distances per group (world units outward from center)
  explosion: {
    distances: {
      bodywork:        3.5,
      powerUnit:       2.5,
      drivetrain:      2.0,
      chassis:         1.5,
      aerodynamics:    3.0,
      suspension:      2.2,
      wheelsAndBrakes: 2.8,
      steering:        3.2,
    },
  },

  // Animation timing (milliseconds)
  animation: {
    explodeDuration:    1000,
    reassembleDuration: 800,
    staggerDelay:       50,
    cascadeDelay:       350,
  },

  // Camera defaults
  camera: {
    position: [6, 4, -6],
    target:   [0, 0.3, 0],
    fov:      45,
  },

  // Group metadata — display names and short descriptions
  groups: {
    bodywork: {
      name: 'Bodywork',
      description:
        'Outer carbon-fibre body panels and aerodynamic shell — the visible livery of the car that covers all internal systems.',
    },
    powerUnit: {
      name: 'Power Unit',
      description:
        'The hybrid power unit combines a 1.6 L turbocharged V6 internal combustion engine with an energy recovery system (ERS) comprising the MGU-K and MGU-H, turbocharger, and energy store.',
    },
    drivetrain: {
      name: 'Drivetrain',
      description:
        'Transfers power from the power unit to the rear wheels via a sequential semi-automatic gearbox with 8 forward gears and 1 reverse, plus the clutch and driveshafts.',
    },
    chassis: {
      name: 'Chassis',
      description:
        'The survival cell (monocoque) is a carbon-fibre composite structure that forms the core of the car, housing the driver and providing mounting points for all other systems.',
    },
    aerodynamics: {
      name: 'Aerodynamics',
      description:
        'Front wing, rear wing, bargeboards, floor, and diffuser work together to generate downforce and manage airflow, providing grip that exceeds the car\'s own weight at speed.',
    },
    suspension: {
      name: 'Suspension',
      description:
        'Multi-link push-rod (front) and pull-rod (rear) suspension with torsion bars, dampers, and anti-roll bars control the ride height and tyre contact patch geometry.',
    },
    wheelsAndBrakes: {
      name: 'Wheels & Brakes',
      description:
        'Carbon-carbon brake discs and pads operate at up to 1000 °C, mounted inside 13″ (or 18″) magnesium alloy wheels wrapped in Pirelli pneumatic tyres.',
    },
    steering: {
      name: 'Steering & Driver',
      description:
        'A carbon-fibre steering wheel integrates over 20 controls, a display, and paddle shifters. The driver\'s seat is custom-moulded, with HANS device and 6-point harness.',
    },
  },
};
