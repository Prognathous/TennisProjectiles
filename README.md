# TennisProjectiles
Basic physics example to model a tennis serve.

Version 1:
----------
- Maths is unverified as it stands so I'm not confident this is right, but it does produce fairly sensible results.
  - There's no lift or air resistance on the vertical axis, nor any attempt to model the Magnus Effect. Version 1's goal is to model a pure, flat serve.
  - Air resistance reference: https://twu.tennis-warehouse.com/learning_center/aerodynamics2.php.
- Integration is a basic Euler approach with a tiny time step for good accuracy. It probably doesn't need to be anything like as aggressively small as this to work well, though.
- This was thrown together quickly over a few hours in April 2024... it's not expected to be slick, just bare bones functionality!
- Credit for the matrix and camera functionality goes to David Li, taken from his Ocean Wave Simulation work (see https://www.experiments.withgoogle.com/ocean-wave-simulation) I was using as reference for implementing my own Tessendorf based water simulation a few years ago.
- The ball flight simulation is found in projectiles.js, plotPath().
