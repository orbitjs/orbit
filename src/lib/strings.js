/* eslint-disable valid-jsdoc */

/**
 Uppercase the first letter of a string, but don't change the remainder.

 @method capitalize
 @for Orbit
 @param {String} str
 @returns {String} capitalized string
 */
export function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 Convert underscored, dasherized, or space-delimited words into lowerCamelCase.

 @method camelize
 @for Orbit
 @param {String} str
 @returns {String} camelized string
 */
export function camelize(str) {
  return str
    .replace(/(\-|\_|\.|\s)+(.)?/g, function(match, separator, chr) {
      return chr ? chr.toUpperCase() : '';
    })
    .replace(/(^|\/)([A-Z])/g, function(match) {
      return match.toLowerCase();
    });
}

/**
 Converts a camelized string into all lowercase separated by underscores.

 @method decamelize
 @for Orbit
 @param {String} str
 @returns {String} lower case, underscored string
 */
export function decamelize(str) {
  return str
    .replace(/([a-z\d])([A-Z])/g, '$1_$2')
    .toLowerCase();
}

/**
 Dasherize words that are underscored, space-delimited, or camelCased.

 @method dasherize
 @for Orbit
 @param {String} str
 @returns {String} dasherized string
 */
export function dasherize(str) {
  return decamelize(str).replace(/[ _]/g, '-');
}

/**
 Underscore words that are dasherized, space-delimited, or camelCased.

 @method underscore
 @for Orbit
 @param {String} str
 @returns {String} underscored string
 */
export function underscore(str) {
  return str
    .replace(/([a-z\d])([A-Z]+)/g, '$1_$2')
    .replace(/\-|\s+/g, '_')
    .toLowerCase();
}
