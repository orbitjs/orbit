/**
 Uppercase the first letter of a string. The remainder of the string won't
 be affected.

 @method capitalize
 @for Orbit
 @param {String} str
 @returns {String} capitalized string
 */
var capitalize = function(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export { capitalize };
