/* eslint-disable valid-jsdoc */

/**
 Creates a deeply nested clone of an object.

 Traverses all object properties (but not prototype properties).

 @method clone
 @for Orbit
 @param {Object} obj
 @returns {Object} Clone of the original object
 */
var clone = function(obj) {
  if (obj === undefined || obj === null || typeof obj !== 'object') { return obj; }

  let dup;
  let type = Object.prototype.toString.call(obj);

  if (type === '[object Date]') {
    dup = new Date();
    dup.setTime(obj.getTime());
  } else if (type === '[object RegExp]') {
    dup = obj.constructor(obj);
  } else if (type === '[object Array]') {
    dup = [];
    for (var i = 0, len = obj.length; i < len; i++) {
      if (obj.hasOwnProperty(i)) {
        dup.push(clone(obj[i]));
      }
    }
  } else {
    var val;

    dup = {};
    for (var key in obj) {
      if (obj.hasOwnProperty(key)) {
        val = obj[key];
        if (typeof val === 'object') { val = clone(val); }
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
 Extend an object with the properties of one or more other objects.

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
  return destination;
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
 Converts an object to an `Array` if it's not already.

 @method toArray
 @for Orbit
 @param {Object} obj
 @returns {Array}
 */
var toArray = function(obj) {
  if (isNone(obj)) {
    return [];
  } else {
    return isArray(obj) ? obj : [obj];
  }
};

/**
 Checks whether a value is a non-null object

 @method isObject
 @for Orbit
 @param {Object} obj
 @returns {boolean}
 */
var isObject = function(obj) {
  return obj !== null && typeof obj === 'object';
};

/**
 Checks whether an object is null or undefined

 @method isNone
 @for Orbit
 @param {Object} obj
 @returns {boolean}
 */
var isNone = function(obj) {
  return obj === undefined || obj === null;
};

/**
 Combines two objects values

 @method merge
 @for Orbit
 @param {Object} base
 @param {Object} source
 @returns {Object}
 */
var merge =  function(base, source) {
  var merged = clone(base);
  if (source) {
    Object.keys(source).forEach(function(field) {
      if (source.hasOwnProperty(field)) {
        var fieldDef = source[field];
        merged[field] = fieldDef;
      }
    });
  }

  return merged;
};

/**
  Similar to the lodash _.get function, this function uses a path to retrieve a
  value from a nested object.

  @param {Object} obj - object to pull values from
  @param {string[]} path - any array of strings specifying the path to use
  @returns {*} the value of the obj at path or undefined
 */
function get(obj, path) {
  let index = -1;
  let result = obj;

  while (++index < path.length) {
    result = result[path[index]];
    if (!result) {
      return result;
    }
  }

  return result;
}

/**
  Similar to the Lodash _.set function, this function uses a path to set a
  value on an object. This function will create objects along the path if
  necessary to allow setting a deeply nested value.

  @param {Object} obj - object to set values in
  @param {string[]} path - any array of strings specifying the path to use
  @param {*} value - the value to set
  @returns {undefined}
 */
function set(obj, path, value) {
  let index = -1;
  let length = path.length;
  let lastIndex = length - 1;
  let nested = obj;

  /* eslint-disable no-eq-null, eqeqeq */
  while (nested != null && ++index < length) {
    let key = path[index];

    if (typeof nested === 'object') {
      let newValue = value;

      if (index != lastIndex) {
        let objValue = nested[key];

        if (objValue == null) {
          newValue = (typeof path[index + 1] === 'number') ? [] : {};
        } else {
          newValue = objValue;
        }
      }

      nested[key] = newValue;
    }

    nested = nested[key];
  }
  /* eslint-enable no-eq-null, eqeqeq */
}

export { clone, expose, extend, isArray, toArray, isObject, isNone, merge, get, set };
