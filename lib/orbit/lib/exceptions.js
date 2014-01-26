/**
 * Exception thrown when a path in a document can not be found.
 *
 * @class PathNotFoundException
 * @namespace Orbit
 * @param {String} path
 * @constructor
 */
var PathNotFoundException = function(path) {
  this.path = path;
};

PathNotFoundException.prototype = {
  constructor: PathNotFoundException
};

export { PathNotFoundException };