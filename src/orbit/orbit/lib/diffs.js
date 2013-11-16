import eq from 'orbit/lib/eq';
import clone from 'orbit/lib/clone';

// TODO - extract
var arrayToOptions = function(arr) {
  var options = {};
  if (arr) {
    for (var i in arr) {
      if (arr.hasOwnProperty(i)) options[arr[i]] = true;
    }
  }
  return options;
};

var diffs = function(a, b, options) {
  if (a === b) {
    return undefined;

  } else {
    options = options || {};

    var ignore = arrayToOptions(options.ignore),
        basePath = options.basePath || '';

    var type = Object.prototype.toString.call(a);
    if (type === Object.prototype.toString.call(b)) {
      if (typeof a === 'object') {
        var i,
            d;

        for (i in b) {
          if (!ignore[i]) {
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
          if (!ignore[i]) {
            if (b[i] === undefined) {
              if (d === undefined) d = [];
              d.push({op: 'remove', path: basePath + '/' + i});
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