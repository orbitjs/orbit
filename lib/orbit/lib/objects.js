import { eq } from './eq';

/**
 Check if a value is a function and returns the function result or the original object if it is not.

 @method computeVal
 @for Orbit
 @param {*} value
 @returns {*} Result of a function or original value

 */
var computeVal = function(value){
  if(value && Object.prototype.toString.call(value) === '[object Function]'){
    return value();
  }else {
    return value;
  }
};

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
};

/**
 Extend a class with the properties and methods of one or more other classes.

 When a method is replaced with another method, it will be wrapped in a
 function that makes the replaced method accessible via `this._super`.

 @method extendClass
 @for Orbit
 @param {Object} destination The class to merge into
 @param {Object} source One or more source classes
 */
var extendClass = function(destination) {
  var sources = Array.prototype.slice.call(arguments, 1);
  sources.forEach(function(source) {
    for (var p in source) {
      if (destination[p] &&
          typeof destination[p] === 'function' &&
          typeof source[p] === 'function') {

        /* jshint loopfunc:true */
        destination[p] =
          (function(destinationFn, sourceFn) {
            return function() {
              var prevSuper = this._super;
              this._super = destinationFn;

              var ret = sourceFn.apply(this, arguments);

              this._super = prevSuper;

              return ret;
            };
          })(destination[p], source[p]);

      } else {
        destination[p] = source[p];
      }
    }
  });
};

// `subclassing` is a state flag used by `defineClass` to track when a class is
// being subclassed. It allows constructors to avoid calling `init`, which can
// be expensive and cause undesireable side effects.
var subclassing = false;

/**
 Define a new class with the properties and methods of one or more other classes.

 The new class can be based on a `SuperClass`, which will be inserted into its
 prototype chain.

 Furthermore, one or more mixins (object that contain properties and/or methods)
 may be specified, which will be applied in order. When a method is replaced
 with another method, it will be wrapped in a function that makes the previous
 method accessible via `this._super`.

 @method defineClass
 @for Orbit
 @param {Object} SuperClass A base class to extend. If `mixins` are to be included
                            without a `SuperClass`, pass `null` for SuperClass.
 @param {Object} mixins One or more objects that contain properties and methods
                        to apply to the new class.
 */
var defineClass = function(SuperClass) {
  var Class = function() {
    if (!subclassing && this.init) {
      this.init.apply(this, arguments);
    }
  };

  if (SuperClass) {
    subclassing = true;
    Class.prototype = new SuperClass();
    subclassing = false;
  }

  if (arguments.length > 1) {
    var extendArgs = Array.prototype.slice.call(arguments, 1);
    extendArgs.unshift(Class.prototype);
    extendClass.apply(Class.prototype, extendArgs);
  }

  Class.constructor = Class;

  Class.extend = function() {
    var args = Array.prototype.slice.call(arguments, 0);
    args.unshift(Class);
    return defineClass.apply(Class, args);
  };

  return Class;
};

/**
 A base class that can be extended.

 @example

 ```javascript
 var CelestialObject = Class.extend({
   init: function(name) {
     this._super();
     this.name = name;
     this.isCelestialObject = true;
   },
   greeting: function() {
     return 'Hello from ' + this.name;
   }
 });

 var Planet = CelestialObject.extend({
   init: function(name) {
     this._super.apply(this, arguments);
     this.isPlanet = true;
   },
   greeting: function() {
     return this._super() + '!';
   },
 });

 var earth = new Planet('Earth');

 console.log(earth instanceof Class);           // true
 console.log(earth instanceof CelestialObject); // true
 console.log(earth instanceof Planet);          // true

 console.log(earth.isCelestialObject);          // true
 console.log(earth.isPlanet);                   // true

 console.log(earth.greeting());                 // 'Hello from Earth!'
 ```

 @class Class
 @for Orbit
 */
var Class = defineClass(null, {
  init: function() {}
});

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

/**
 Checks whether an object is numeric

 @method isNumeric
 @for Orbit
 @param {Object} obj
 @returns {boolean}
 */
var isNumeric = function( obj ) {
  return !isArray( obj ) && obj - parseFloat( obj ) >= 0;
};

export { Class, computeVal, clone, defineClass, expose, extend, extendClass, isArray, isNone, isNumeric };
