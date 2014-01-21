import eq from 'orbit/lib/eq';
import clone from 'orbit/lib/clone';

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
  Namespace for all core Orbit methods and classes.

  @class Orbit
  @static
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

  assert: function(desc, test) {
    if (!test) throw new Error("Assertion failed: " + desc);
  },

  capitalize: function(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  },

  expose: function(destination, source) {
    var properties;
    if (arguments.length > 2) {
      properties = Array.prototype.slice.call(arguments, 2);
    } else {
      properties = source;
    }

    properties.forEach(function(p) {
      if (typeof source[p] === 'function') {
        destination[p] = function() {
          return source[p].apply(source, arguments);
        };
      } else {
        destination[p] = source[p];
      }
    });
  },

  extend: function(destination) {
    var sources = Array.prototype.slice.call(arguments, 1);
    sources.forEach(function(source) {
      for (var p in source) {
        destination[p] = source[p];
      }
    });
  },

  K: function() { return this; },

  arrayToOptions: function(arr) {
    var options = {};
    if (arr) {
      for (var i in arr) {
        if (arr.hasOwnProperty(i)) options[arr[i]] = true;
      }
    }
    return options;
  },

  promisifyException: function(e) {
    return new Orbit.Promise(function(resolve, reject) {
      reject(e);
    });
  }
};

Orbit.NotFoundException = function(type, record) {
  this.type = type;
  this.record = record;
};
Orbit.NotFoundException.prototype = {
  constructor: 'NotFoundException'
};

Orbit.AlreadyExistsException = function(type, record) {
  this.type = type;
  this.record = record;
};
Orbit.AlreadyExistsException.prototype = {
  constructor: 'AlreadyExistsException'
};


export default Orbit;