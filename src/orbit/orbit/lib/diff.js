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

var diff = function(a, b, ignore) {
  if (a === b) {
    return undefined;

  } else if (typeof b === 'object' &&
             typeof a === 'object') {

    ignore = arrayToOptions(ignore);

    var d;
    for (var i in b) {
      // We are deliberately just checking equality at the top level.
      // Any nested objects are either equal or not, and will be returned
      // in the delta in their entirety.
      if (!ignore[i] && !eq(a[i], b[i])) {
        if (d === undefined) d = {};
        d[i] = clone(b[i]);
      }
    }
    return d;

  } else {
    return b;
  }
};

export default diff;