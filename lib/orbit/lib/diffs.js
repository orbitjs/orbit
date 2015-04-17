import { eq } from './eq';
import { clone, isArray } from './objects';
import { arrayToOptions } from './config';

/**
 Determines the patch operations required to convert one object to another.

 See [RFC 6902](http://tools.ietf.org/html/rfc6902) for a description of patch
 operations and a full set of examples.

 @example

 ``` javascript
 var a, b;

 a = {foo: 'bar'};
 b = {foo: 'bar', 'baz': 'qux'};

 Orbit.diffs(a, b); // [{op: 'add', path: '/baz', value: 'qux'}]
 ```

 @method diffs
 @for Orbit
 @param a
 @param b
 @param {Object} [options]
 @param {Array}  [options.ignore] Properties to ignore
 @param {String} [options.basePath] A base path to be prefixed to all paths in return patch operations
 @returns {Array} Array of patch operations to get from `a` to `b` (or undefined if they are equal)
 */
var diffs = function(a, b, options) {
  if (a === b) {
    return undefined;

  } else {
    options = options || {};

    var ignore = arrayToOptions(options.ignore),
        basePath = options.basePath || '';

    if (isArray(basePath)) {
      basePath = basePath.join('/');
    }

    var type = Object.prototype.toString.call(a);
    if (type === Object.prototype.toString.call(b)) {
      if (a !== null && typeof a === 'object') {
        var i,
            d;

        if (isArray(a)) {
          var aLength = a.length,
              bLength = b.length,
              maxLength = bLength > aLength ? bLength : aLength,
              match,
              ai = 0,
              bi = 0,
              bj;

          for (i = 0; i < maxLength; i++) {
            if (ai >= aLength) {
              if (d === undefined) d = [];
              d.push({op: 'add', path: basePath + '/' + bi, value: clone(b[bi])});
              bi++;

            } else if (bi >= bLength) {
              if (d === undefined) d = [];
              d.push({op: 'remove', path: basePath + '/' + ai});
              ai++;

            } else if (!eq(a[ai], b[bi])) {
              match = -1;
              for (bj = bi + 1; bj < bLength; bj++) {
                if (eq(a[ai], b[bj])) {
                  match = bj;
                  break;
                }
              }
              if (match === -1) {
                if (d === undefined) d = [];
                d.push({op: 'remove', path: basePath + '/' + ai});
                ai++;

              } else {
                if (d === undefined) d = [];
                d.push({op: 'add', path: basePath + '/' + bi, value: clone(b[bi])});
                bi++;
              }
            } else {
              ai++;
              bi++;
            }
          }
        } else if (a instanceof Date) {
          if (a.getTime() === b.getTime()) return;
          if (d === undefined) d = [];
          d.push({op: 'replace', path: basePath, value: clone(b)});

        } else { // general (non-array) object
          for (i in b) {
            if (!ignore[i] && b.hasOwnProperty(i)) {
              if (a[i] === undefined) {
                if (d === undefined) d = [];
                d.push({op: 'add', path: basePath + '/' + i, value: clone(b[i])});

              } else if (!eq(a[i], b[i])) {
                if (d === undefined) d = [];
                d = d.concat(diffs(a[i], b[i], {basePath: basePath + '/' + i}));
              }
            }
          }

          for (i in a) {
            if (!ignore[i] && a.hasOwnProperty(i)) {
              if (b[i] === undefined) {
                if (d === undefined) d = [];
                d.push({op: 'remove', path: basePath + '/' + i});
              }
            }
          }
        }

        return d;

      } else if (eq(a, b)) {
        return undefined;
      }
    }

    return [{op: 'replace', path: basePath, value: clone(b)}];
  }
};

export { diffs };
