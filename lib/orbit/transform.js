import { toArray, Class } from './lib/objects';
import { normalizeOperations } from './lib/operations';
import { uuid } from './lib/uuid';

/**
 Transforms represent a set of operations that are applied against a
 source. After a transform has been applied, it should be assigned the
 `result`, a `TransformResult` that represents the result of the transform.

 Transforms are automatically assigned a UUID `id`. They can maintain their
 ancestry in a `log`. In this way, it is possible to determine whether
 transform preceded each other.

 Transforms can `spawn` descendants, which automatically adds the parent to
 the child's history.

 @class Transform
 @namespace Orbit
 @param {Array}     [operations] Operations to apply
 @param {Object}    [options]
 @param {String}    [options.id] Unique id for this transform (will be assigned a uuid by default)
 @param {Transform} [options.parent] The parent transform that spawned this one.
 @param {Array}     [options.log]
 @constructor
 */
var Transform = Class.extend({
  operations: null,

  log: null,

  init: function(operations, options) {
    this.operations = [];
    if (operations) this.push(operations);

    options = options || {};

    this.id = options.id || uuid();

    if (options.parent) {
      this.log = options.parent.log.concat(options.parent.id);
    } else {
      this.log = options.log || [];
    }
  },

  isEmpty: function() {
    return this.operations.length === 0;
  },

  push: function(ops) {
    var normalizedOperations = normalizeOperations( toArray(ops) );
    Array.prototype.push.apply(this.operations, normalizedOperations);
  },

  descendedFrom: function(transform) {
    return this.log.indexOf(transform.id || transform) > -1;
  },

  relatedTo: function(transform) {
    if (transform instanceof Transform) {
      return (transform.descendedFrom(this.log[0] || this.id) ||
              this.descendedFrom(transform.log[0] || transform.id) ||
              this.id === transform.id);
    } else {
      return this.descendedFrom(transform) || this.id === transform;
    }
  },

  spawn: function(operations, options) {
    options = options || {};
    options.parent = this;

    return new Transform(operations, options);
  }
});

export default Transform;
