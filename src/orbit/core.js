import eq from 'orbit/lib/eq';

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
    if (record[this.idField]) {
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

  isEqual: eq,

  clone: function(obj) {
    if (obj === undefined || obj === null || typeof obj !== 'object') return obj;

    var dup,
        type = Object.prototype.toString.call(obj);

    if (type === "[object Date]") {
      dup = new Date();
      dup.setTime(obj.getTime());

    } else if (type === "[object RegExp]") {
      dup = obj.constructor(obj);

    } else if (type === "[object Array]") {
      dup = [];
      for (var i = 0, len = obj.length; i < len; i++) {
        if (obj.hasOwnProperty(i)) {
          dup.push(this.clone(obj[i]));
        }
      }

    } else  {
      var val;

      dup = {};
      for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
          val = obj[key];
          if (typeof val === 'object') val = this.clone(val);
          dup[key] = val;
        }
      }
    }
    return dup;
  },

  delta: function(a, b, ignore) {
    if (a === b) {
      return undefined;

    } else if (typeof b === 'object' &&
               typeof a === 'object') {

      ignore = this.arrayToOptions(ignore);

      var d;
      for (var i in b) {
        // We are deliberately just checking equality at the top level.
        // Any nested objects are either equal or not, and will be returned
        // in the delta in their entirety.
        if (!ignore[i] && !eq(a[i], b[i])) {
          if (d === undefined) d = {};
          d[i] = Orbit.clone(b[i]);
        }
      }
      return d;

    } else {
      return b;
    }
  },

  arrayToOptions: function(arr) {
    var options = {};
    if (arr) {
      for (var i in arr) {
        if (arr.hasOwnProperty(i)) options[arr[i]] = true;
      }
    }
    return options;
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