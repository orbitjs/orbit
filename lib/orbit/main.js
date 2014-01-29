/**
 Contains core methods and classes for Orbit.js

 @module orbit
 @main orbit
 */

// Prototype extensions
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
 Namespace for core Orbit methods and classes.

 @class Orbit
 @static
 */
var Orbit = {};

export default Orbit;
