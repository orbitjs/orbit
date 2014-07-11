import { Class } from './objects';

/**
 Base Exception

 @class Exception
 @namespace Orbit
 @constructor
 */
var Exception = Class.extend();

/**
 Exception thrown when a path in a document can not be found.

 @class PathNotFoundException
 @namespace Orbit
 @param {String} path
 @constructor
 */
var PathNotFoundException = Exception.extend({
  init: function(path) {
    this.path = path;
  }
});

export { Exception, PathNotFoundException };