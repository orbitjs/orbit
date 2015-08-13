import { Class, clone } from './lib/objects';

function includeValue(operation) {
  return operation.op !== 'remove';
}

/**
 `Operation` provides a thin wrapper over a JSON Patch operation.

 Operations maintain the standard Patch attributes: `op`, `path`, and `value`.

 @class Operation
 @namespace Orbit
 @param {Object}    [options]
 @param {String}    [options.op] Patch attribute `op`
 @param {String}    [options.path] Patch attribute `path`
 @param {Object}    [options.value] Patch attribute `value`
 @constructor
 */
export default Class.extend({
  op: null,
  path: null,
  value: null,

  init: function(options) {
    options = options || {};

    var path = options.path;
    if (typeof path === 'string') {
      if (path.indexOf('/') === 0) {
        path = path.substr(1);
      }
      if (path.length === 0) {
        path = [];
      } else {
        path = path.split('/');
      }
    }

    this.op = options.op;
    this.path = path;
    if (includeValue(this)) {
      this.value = options.value;
    } else {
      this.value = undefined;
    }
  },

  serialize: function() {
    var serialized = {
      op: this.op,
      path: this.path.join('/')
    };

    if (includeValue(this)) {
      serialized.value = this.value;
    }

    return serialized;
  }
});
