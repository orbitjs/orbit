/**
 * Prototype extensions
 */
if (!Array.prototype.forEach) {
  Array.prototype.forEach = function (fn, scope) {
    var i, len;
    for (i = 0, len = this.length; i < len; ++i) {
      if (i in this) {
        fn.call(scope, this[i], i, this);
      }
    }
  };
}

/**
 * Orbit
 */
var Orbit = {};

Orbit.assert = function(desc, test) {
  if (!test) {
    throw new Error("Assertion failed: " + desc);
  }
};

Orbit.capitalize = function(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export default Orbit;