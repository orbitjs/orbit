import { eq } from './eq';

/**
 Creates a deeply nested clone of an object.

 Traverses all object properties (but not prototype properties).

 @method clone
 @for Orbit
 @param {Object} obj
 @returns {Object} Clone of the original object
 */
var clone = function(obj) {
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
        dup.push(clone(obj[i]));
      }
    }

  } else  {
    var val;

    dup = {};
    for (var key in obj) {
      if (obj.hasOwnProperty(key)) {
        val = obj[key];
        if (typeof val === 'object') val = clone(val);
        dup[key] = val;
      }
    }
  }
  return dup;
};

/**
 Expose properties and methods from one object on another.

 Methods will be called on `source` and will maintain `source` as the
 context.

 @method expose
 @for Orbit
 @param {Object} destination
 @param {Object} source
 */
var expose = function(destination, source) {
  var properties;
  if (arguments.length > 2) {
    properties = Array.prototype.slice.call(arguments, 2);
  } else {
    properties = Object.keys(source);
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
};

/**
 Extend an object with the properties of one or more other objects

 @method extend
 @for Orbit
 @param {Object} destination The object to merge into
 @param {Object} source One or more source objects
 */
var extend = function(destination) {
  var sources = Array.prototype.slice.call(arguments, 1);
  sources.forEach(function(source) {
    for (var p in source) {
      if (source.hasOwnProperty(p)) {
        destination[p] = source[p];
      }
    }
  });
};

/**
 Checks whether an object is an instance of an `Array`

 @method isArray
 @for Orbit
 @param {Object} obj
 @returns {boolean}
 */
var isArray = function(obj) {
  return Object.prototype.toString.call(obj) === '[object Array]';
};

/**
 Checks whether an object is null or undefined

 @method isArray
 @for Orbit
 @param {Object} obj
 @returns {boolean}
 */
var isNone = function(obj) {
  return obj === undefined || obj === null;
};

export { clone, eq, expose, extend, isArray, isNone };
