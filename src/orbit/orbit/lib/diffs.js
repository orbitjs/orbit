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
    options.ignore = arrayToOptions(options.ignore);
    options.basePath = options.basePath || '';

    if (typeof b === 'object' && typeof a === 'object') {
      var i,
          d;

      for (i in b) {
        if (!options.ignore[i]) {
          if (a[i] === undefined) {
            if (d === undefined) d = [];
            d.push({op: 'add', path: options.basePath + '/' + i, value: clone(b[i])});

          } else if (!eq(a[i], b[i])) {
            if (d === undefined) d = [];
            d = d.concat(diffs(a[i], b[i], {basePath: options.basePath + '/' + i}));
          }
        }
      }

      for (i in a) {
        if (!options.ignore[i]) {
          if (b[i] === undefined) {
            if (d === undefined) d = [];
            d.push({op: 'remove', path: options.basePath + '/' + i});
          }
        }
      }

      return d;

    } else {
      return [{op: 'replace', path: options.basePath, value: clone(b)}];
    }
  }
};

export default diffs;