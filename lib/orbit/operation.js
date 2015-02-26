import { Class, clone } from './lib/objects';
import { uuid } from './lib/uuid';

function includeValue(operation) {
  return operation.op !== 'remove';
}

/**
 `Operation` provides a thin wrapper over a JSON Patch operation.

 Operations maintain the standard Patch attributes: `op`, `path`, and `value`.

 Operations are automatically assigned a UUID `id`. They can maintain their
 ancestry in a `log`. In this way, it is possible to determine whether
 operations preceded each other.

 Operations can `spawn` descendants, which automatically adds the parent to
 the child's history.

 @class Operation
 @namespace Orbit
 @param {Object}    [options]
 @param {String}    [options.op] Patch attribute `op`
 @param {String}    [options.path] Patch attribute `path`
 @param {Object}    [options.value] Patch attribute `value`
 @param {Operation} [options.parent] parent operation that spawned this one
 @constructor
 */
var Operation = Class.extend({
  op: null,
  path: null,
  value: null,
  log: null,

  init: function(options) {
    var path = options.path;
    if (typeof path === 'string') path = path.split('/');

    this.op = options.op;
    this.path = path;
    if (includeValue(this)) {
      this.value = options.value;
    }

    this.id = uuid();

    if (options.parent) {
      this.log = options.parent.log.concat(options.parent.id);
    } else {
      this.log = [];
    }
  },

  spawnedFrom: function(operation) {
    return this.log.indexOf(operation.id || operation) > -1;
  },

  spawn: function(data) {
    return new Operation({
      op: data.op,
      path: data.path,
      value: data.value,
      parent: this
    });
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

export default Operation;
