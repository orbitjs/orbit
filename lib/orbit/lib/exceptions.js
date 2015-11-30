import { Class } from './objects';

/**
 Base Exception

 @class Exception
 @namespace Orbit
 @constructor
 */
var Exception = Class.extend({
  init: function(message) {
    this.message = message;
    this.error = new Error(this.toString());
    this.stack = this.error.stack;
  },

  name: 'Orbit.Exception',

  toString: function() {
    return this.name + ': ' + this.message;
  }
});

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
    this._super(path.join('/'));
  },

  name: 'Orbit.PathNotFoundException'
});

var QueryProcessorNotFoundException = Exception.extend({
  init: function(query) {
    this.query = query;
    this._super(...arguments);
  },

  name: 'Orbit.QueryProcessorNotFoundException'
});

var TransformNotLoggedException = Exception.extend({
  init: function(transformId) {
    this.transformId = transformId;
    this._super(`Transform not logged: ${transformId}`);
  },

  name: 'Orbit.TransformNotLoggedException'
});

export { Exception, PathNotFoundException, QueryProcessorNotFoundException, TransformNotLoggedException };
