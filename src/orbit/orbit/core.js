import eq from 'orbit/lib/eq';
import clone from 'orbit/lib/clone';

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
var Orbit = {
  idField: '__id',

  generateId: function() {
    if (this._newId) {
      this._newId++;
    } else {
      this._newId = 1;
    }
    return new Date().getTime() + '.' + this._newId;
  },

  versionField: '__ver',

  incrementVersion: function(record) {
    if (record[this.versionField] || record[this.idField] === undefined) {
      record[this.versionField] = this.generateId();
    } else {
      record[this.versionField] = record[this.idField];
    }
  },

  assert: function(desc, test) {
    if (!test) throw new Error("Assertion failed: " + desc);
  },

  capitalize: function(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  },

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