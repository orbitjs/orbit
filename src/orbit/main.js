/* globals Promise */
/**
 Contains core methods and classes for Orbit.js

 @module orbit
 @main orbit
 */

/**
 Namespace for core Orbit methods and classes.

 @class Orbit
 @static
 */
var Orbit = {};

if (typeof Promise !== 'undefined') {
  Orbit.Promise = Promise;
}

export default Orbit;
