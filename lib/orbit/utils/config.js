/**
 * Converts an array of values to an object with those values as properties
 * having a value of `true`.
 *
 * This is useful for converting an array of settings to a more efficiently
 * accessible settings object.
 *
 * For example:
 *
 * ``` javascript
 * Orbit.arrayToOptions(['a', 'b']); // returns {a: true, b: true}
 * ```
 *
 * @method arrayToOptions
 * @param arr
 * @returns {Object}
 */
var arrayToOptions = function(arr) {
  var options = {};
  if (arr) {
    for (var i in arr) {
      if (arr.hasOwnProperty(i)) options[arr[i]] = true;
    }
  }
  return options;
};

export { arrayToOptions };
