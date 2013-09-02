var Orbit = {};

Orbit.required = function() {
  throw new Error('Required property not defined');
};

Orbit.assert = function(desc, test) {
  if (!test) {
    throw new Error("Assertion failed: " + desc);
  }
};

export default Orbit;