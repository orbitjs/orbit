/* eslint-disable valid-jsdoc */

/**
 * Clones a value. If the value is an object, a deeply nested clone will be
 * created.
 *
 * Traverses all object properties (but not prototype properties).
 *
 * @export
 * @param {*} obj
 * @returns {*} Clone of the input `obj`
 */
export function clone(obj: any): any {
  if (obj === undefined || obj === null || typeof obj !== 'object') { return obj; }

  let dup: any;
  let type = Object.prototype.toString.call(obj);

  if (type === '[object Date]') {
    dup = new Date();
    dup.setTime(obj.getTime());
  } else if (type === '[object RegExp]') {
    dup = obj.constructor(obj);
  } else if (type === '[object Array]') {
    dup = [];
    for (let i = 0, len = obj.length; i < len; i++) {
      if (obj.hasOwnProperty(i)) {
        dup.push(clone(obj[i]));
      }
    }
  } else {
    let val;

    dup = {};
    for (let key in obj) {
      if (obj.hasOwnProperty(key)) {
        val = obj[key];
        if (typeof val === 'object') { val = clone(val); }
        dup[key] = val;
      }
    }
  }
  return dup;
}

/**
 * Expose properties and methods from one object on another.
 *
 * Methods will be called on `source` and will maintain `source` as the context.
 *
 * @export
 * @param {*} destination
 * @param {*} source
 */
export function expose(destination: any, source: any): void {
  let properties: string[];
  if (arguments.length > 2) {
    properties = Array.prototype.slice.call(arguments, 2);
  } else {
    properties = Object.keys(source);
  }

  properties.forEach(p => {
    if (typeof source[p] === 'function') {
      destination[p] = function() {
        return source[p].apply(source, arguments);
      };
    } else {
      destination[p] = source[p];
    }
  });
}

/**
 * Extend an object with the properties of one or more other objects.
 *
 * @export
 * @param {*} destination
 * @param {...any[]} sources
 * @returns {any}
 */
export function extend(destination: any, ...sources: any[]): any {
  sources.forEach(source => {
    for (let p in source) {
      if (source.hasOwnProperty(p)) {
        destination[p] = source[p];
      }
    }
  });
  return destination;
}

/**
 * Checks whether an object is an instance of an `Array`
 *
 * @export
 * @param {*} obj
 * @returns {boolean}
 */
export function isArray(obj: any): boolean {
  return Object.prototype.toString.call(obj) === '[object Array]';
}

/**
 * Converts an object to an `Array` if it's not already.
 *
 * @export
 * @param {*} obj
 * @returns {any[]}
 */
export function toArray(obj: any): any[] {
  if (isNone(obj)) {
    return [];
  } else {
    return isArray(obj) ? obj : [obj];
  }
}

/**
 * Checks whether a value is a non-null object
 *
 * @export
 * @param {*} obj
 * @returns {boolean}
 */
export function isObject(obj: any): boolean {
  return obj !== null && typeof obj === 'object';
}

/**
 * Checks whether an object is null or undefined
 *
 * @export
 * @param {*} obj
 * @returns {boolean}
 */
export function isNone(obj: any): boolean {
  return obj === undefined || obj === null;
}

/**
 * Merges properties from other objects into a base object. Properties that
 * resolve to `undefined` will not overwrite properties on the base object
 * that already exist.
 *
 * @export
 * @param {*} base
 * @param {...any[]} sources
 * @returns {*}
 */
export function merge(object: any, ...sources: any[]): any {
  sources.forEach(source => {
    Object.keys(source).forEach(field => {
      if (source.hasOwnProperty(field)) {
        let value = source[field];
        if (value !== undefined) {
          object[field] = value;
        }
      }
    });
  });
  return object;
}

/**
 * Merges properties from other objects into a base object, traversing and
 * merging any objects that are encountered.
 *
 * Properties that resolve to `undefined` will not overwrite properties on the
 * base object that already exist.
 *
 * @export
 * @param {*} base
 * @param {...any[]} sources
 * @returns {*}
 */
export function deepMerge(object: any, ...sources: any[]): any {
  sources.forEach(source => {
    Object.keys(source).forEach(field => {
      if (source.hasOwnProperty(field)) {
        let a = object[field];
        let b = source[field];
        if (isObject(a) && isObject(b) &&
            !isArray(a) && !isArray(b)) {
          deepMerge(a, b);
        } else if (b !== undefined) {
          object[field] = b;
        }
      }
    });
  });
  return object;
}

/**
 * Retrieves a value from a nested path on an object.
 *
 * Returns any falsy value encountered while traversing the path.
 *
 * @export
 * @param {*} obj
 * @param {string[]} path
 * @returns {*}
 */
export function deepGet(obj: any, path: string[]): any {
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
 * Sets a value on an object at a nested path.
 *
 * This function will create objects along the path if necessary to allow
 * setting a deeply nested value.
 *
 * Returns `false` only if the current value is already strictly equal to the
 * requested `value` argument. Otherwise returns `true`.
 *
 * @export
 * @param {*} obj
 * @param {string[]} path
 * @param {*} value
 * @returns {boolean} was the value was actually changed?
 */
export function deepSet(obj: any, path: string[], value: any): boolean {
  let ptr = obj;
  let prop = path.pop();
  let segment;
  for (let i = 0, l = path.length; i < l; i++) {
    segment = path[i];
    if (ptr[segment] === undefined) {
      ptr[segment] = (typeof segment === 'number') ? [] : {};
    }
    ptr = ptr[segment];
  }
  if (ptr[prop!] === value) {
    return false;
  } else {
    ptr[prop!] = value;
    return true;
  }
}

/**
 * Find an array of values that correspond to the keys of an object.
 *
 * This is a ponyfill for `Object.values`, which is still experimental.
 *
 * @export
 * @param {*} obj
 * @returns {any[]}
 */
export function objectValues(obj: any): any[] {
  if (Object.values) {
    return Object.values(obj);
  } else {
    return Object.keys(obj).map(k => obj[k]);
  }
}
