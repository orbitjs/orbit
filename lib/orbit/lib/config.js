/**
 Converts an array of values to an object with those values as properties
 having a value of `true`.

 This is useful for converting an array of settings to a more efficiently
 accessible settings object.

 @example

 ``` javascript
 Orbit.arrayToOptions(['a', 'b']); // returns {a: true, b: true}
 ```

 @method arrayToOptions
 @for Orbit
 @param {Array} a
 @returns {Object} Set of options, keyed by the elements in `a`
 */
var arrayToOptions = function(a) {
  var options = {};
  if (a) {
    for (var i = 0, list = Object.keys(a), len = list.length; i < len; ++i) {
      options[a[list[i]]] = true;
    }
  }
  return options;
};

export { arrayToOptions };
