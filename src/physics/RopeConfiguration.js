/**
 * RopeConfiguration - Configurable parameters for rope physics and debug options.
 */
export const RopeConfiguration = {
  segmentCount: 20,          // Number of rope segments (~21 points)
  totalLength: 220,          // Total default length of rope in pixels
  gravity: 1200,             // Gravity acceleration (px/s^2)
  damping: 0.985,            // Damping / air resistance multiplier
  constraintIterations: 8,   // Constraint relaxation iterations per frame
  charmMassRatio: 3.0,       // Charm node weight multiplier
  sleepThreshold: 0.0005,    // Kinetic energy threshold below which simulation sleeps
  debug: false               // Render debug nodes and constraint vectors when true
};
