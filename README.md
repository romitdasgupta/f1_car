# F1 CAR // MECHANICAL BREAKOUT

An interactive 3D exploded-view diagram of a Formula 1 car, built entirely with [Three.js](https://threejs.org/) — no external models, just procedural geometry.

![Assembled F1 car](docs/f1_car_assembled.png)

## Overview

Every part of the car — from the carbon-fibre monocoque to the Pirelli-branded tires — is constructed in code using vertex-deformed high-poly geometry, custom shaders, and canvas-generated textures. Click **Explode All** to cascade every system outward and reveal 70+ individually labeled components.

![Exploded view with labeled parts](docs/f1_car_exploded.png)

## Systems

| System | Parts | Description |
|--------|-------|-------------|
| **Bodywork** | Upper/lower shell, nose fairing, side panels, rear cowl | Outer carbon-fibre body panels and aerodynamic shell |
| **Power Unit** | V6 engine block, turbo, MGU-K, MGU-H, energy store | 1.6L turbocharged hybrid powertrain |
| **Drivetrain** | Gearbox, gear cluster, clutch, differential, driveshafts | 8-speed sequential semi-automatic transmission |
| **Chassis** | Survival cell, halo, floor, diffuser, crash structures | Carbon-fibre monocoque with safety structures |
| **Aerodynamics** | Front/rear wings, endplates, sidepods, beam wing | Downforce generation and airflow management |
| **Suspension** | Upper/lower wishbones, pushrods, pullrods | Multi-link push-rod (front) and pull-rod (rear) |
| **Wheels & Brakes** | Tires, rims, brake assemblies | Carbon-carbon brakes with Pirelli tire textures |
| **Steering & Driver** | Steering wheel with LCD, pedals, harness, HANS, seat | Full cockpit with canvas-rendered dashboard display |

## Features

- **Cascade explosion** — systems fly apart in sequence with tween-animated transitions, then auto-reassemble
- **Per-system toggle** — click any system in the sidebar to explode/collapse it independently
- **Part inspection** — click any part to see its name and description in the detail panel
- **Orbit controls** — drag to rotate, scroll to zoom, right-drag to pan
- **Procedural geometry** — smoothstep-sculpted shapes with coke-bottle tapering, airfoil profiles, and organic contours
- **Canvas textures** — steering wheel LCD display with RPM bar, gear indicator, and telemetry; Pirelli sidewall branding on tires

## Tech Stack

- [Three.js](https://threejs.org/) (r170) — WebGL rendering, PBR materials, shadow maps
- [Tween.js](https://github.com/tweenjs/tween.js/) — smooth explosion/reassembly animations
- CSS2DRenderer — floating part labels
- Vanilla HTML/CSS/JS — no build step required

## Getting Started

Serve the project directory with any static file server:

```bash
# Python
python3 -m http.server 8000

# Node
npx serve .
```

Then open `http://localhost:8000` in your browser.

## Project Structure

```
index.html                  Entry point and UI layout
css/style.css               Styling for panels, overlays, and controls
js/
  main.js                   Scene setup, lighting, camera, animation loop
  data/
    colors.js               Color palette for each system
    config.js               Explosion distances, animation timing, group metadata
  parts/
    bodywork.js             Body shell and fairing panels
    chassis.js              Monocoque, halo, floor, crash structures
    powerUnit.js            Engine, turbo, hybrid components
    drivetrain.js           Gearbox, differential, driveshafts
    aerodynamics.js         Wings, endplates, sidepods
    suspension.js           Wishbones, pushrods, pullrods
    wheelsAndBrakes.js      Tires, rims, brake assemblies
    steeringAndDriver.js    Cockpit, steering wheel, safety gear
  geometry/
    shapes.js               Airfoil, monocoque, and seat profile generators
    factories.js            Wishbone, wheel assembly, turbo builders
  systems/
    explosionManager.js     Cascade explode/reset with per-group tweens
    interactionManager.js   Raycasting, hover highlights, click selection
    labelManager.js         CSS2D floating labels
    animationManager.js     Tween update loop
```

## License

MIT
