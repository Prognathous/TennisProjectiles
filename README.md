# TennisProjectiles
Basic physics example to model a tennis serve.

Version 1:
----------
- Maths is unverified as it stands so I'm far from confident this is right.
  - There's no lift, air resistance on the vertical axis or any attempt to model the Magnus Effect.
  - Air resistance reference https://twu.tennis-warehouse.com/learning_center/aerodynamics2.php
- Integration is a basic Euler approach with a tiny time step for good accuracy. It probably doesn't need to be anything like as aggressively small as this to work well, though.
- This was made over a few hours in April 2024... it's not expected to be slick, just bare bones functional!
- Matrix and camera functionality taken from David Li's Ocean Wave Simulation work (see https://www.experiments.withgoogle.com/ocean-wave-simulation)
