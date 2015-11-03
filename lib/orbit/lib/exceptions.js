import { Class } from './objects';

/**
 Base Exception

 @class Exception
 @namespace Orbit
 @constructor
 */
const Exception = Class.extend({
  init: function(message) {
    this.message = message;
    this.error = new Error(this.toString());
    this.stack = this.error.stack;
  },

  name: 'Orbit.Exception',

  toString: function() {
    return this.name + ': ' + this.message;
  },
});

/**
 Exception thrown when a path in a document can not be found.

 @class PathNotFoundException
 @namespace Orbit
 @param {String} path
 @constructor
 */
const PathNotFoundException = Exception.extend({
  init: function(path) {
    this.path = path;
    this._super(path.join('/'));
  },

  name: 'Orbit.PathNotFoundException',
});

const QueryProcessorNotFoundException = Exception.extend({
  init: function(query) {
    this.query = query;
    this._super(...arguments);
  },

  name: 'Orbit.QueryProcessorNotFoundException'
});

export { Exception, PathNotFoundException, QueryProcessorNotFoundException };
