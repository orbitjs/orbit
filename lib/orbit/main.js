/**
  Orbit

  @module orbit
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
 * Namespace for core Orbit methods and classes.
 *
 * @class Orbit
 * @static
 */
var Orbit = {
  // TODO - move to schema
  generateId: function() {
    if (this._newId) {
      this._newId++;
    } else {
      this._newId = 1;
    }
    return new Date().getTime() + '.' + this._newId;
  },

  /**
   * Throw an exception if `test` is not truthy.
   *
   * @mathod assert
   * @param desc Description of the error thrown
   * @param test
   */
  assert: function(desc, test) {
    if (!test) throw new Error("Assertion failed: " + desc);
  },

  /**
   * Uppercase the first letter of a string. The remainder of the string won't
   * be affected.
   *
   * @method capitalize
   * @param {String} str
   * @returns {String}
   */
  capitalize: function(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  },

  /**
   * Empty method that returns the current context (i.e. `this`).
   *
   * Use as a placeholder for some static methods.
   *
   * @method K
   * @returns {Object}
   */
  K: function() { return this; }
};

/**
 * Exception thrown when a record can not be found.
 *
 * @class NotFoundException
 * @namespace Orbit
 * @param {String} type
 * @param record
 * @constructor
 */
Orbit.NotFoundException = function(type, record) {
  this.type = type;
  this.record = record;
};
Orbit.NotFoundException.prototype = {
  constructor: 'NotFoundException'
};

/**
 * Exception thrown when a record already exists.
 *
 * @class AlreadyExistsException
 * @namespace Orbit
 * @param {String} type
 * @param record
 * @constructor
 */
Orbit.AlreadyExistsException = function(type, record) {
  this.type = type;
  this.record = record;
};
Orbit.AlreadyExistsException.prototype = {
  constructor: 'AlreadyExistsException'
};

export default Orbit;