/**
 * @class PathNotFoundException
 * @namespace Orbit
 * @description

 Exception thrown when a path in a document can not be found.

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