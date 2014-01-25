import eq from 'orbit/utils/eq';
import clone from 'orbit/utils/clone';
import { arrayToOptions } from 'orbit/utils/config';

var diffs = function(a, b, options) {
  if (a === b) {
    return undefined;

  } else {
    options = options || {};

    var ignore = arrayToOptions(options.ignore),
        basePath = options.basePath || '';

    if (Object.prototype.toString.call(basePath) === '[object Array]') {
      basePath = basePath.join('/');
    }

    var type = Object.prototype.toString.call(a);
    if (type === Object.prototype.toString.call(b)) {
      if (typeof a === 'object') {
        var i,
            d;

        if (type === '[object Array]') {
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

export default diffs;