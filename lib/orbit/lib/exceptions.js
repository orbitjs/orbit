import { Class } from './objects';

/**
 Base Exception

 @class Exception
 @namespace Orbit
 @constructor
 */
export const Exception = Class.extend({
  init(message) {
    this.message = message;
    this.error = new Error(this.toString());
    this.stack = this.error.stack;
  },

  name: 'Orbit.Exception',

  toString() {
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
export const PathNotFoundException = Exception.extend({
  init(path) {
    this.path = path;
    this._super(path.join('/'));
  },

  name: 'Orbit.PathNotFoundException'
});

export const TransformNotLoggedException = Exception.extend({
  init(transformId) {
    this.transformId = transformId;
    this._super(`Transform not logged: ${transformId}`);
  },

  name: 'Orbit.TransformNotLoggedException'
});

export const TransformBuilderNotRegisteredException = Exception.extend({
  name: 'Orbit.TransformBuilderNotRegisteredException'
});
