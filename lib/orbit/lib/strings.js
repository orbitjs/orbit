/**
 * Uppercase the first letter of a string. The remainder of the string won't
 * be affected.
 *
 * @method capitalize
 * @param {String} str
 * @returns {String}
 */
var capitalize = function(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export { capitalize };