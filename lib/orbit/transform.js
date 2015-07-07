import { Class } from './lib/objects';
import { uuid } from './lib/uuid';

/**
 `Transform`

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
 @param {Array}     [options.completedOperations]
 @param {Array}     [options.inverseOperations]
 @constructor
 */
var Transform = Class.extend({
  operations: null,

  log: null,

  init: function(operations, options) {
    this.operations = operations || [];

    options = options || {};

    this.id = options.id || uuid();

    if (options.parent) {
      this.log = options.parent.log.concat(options.parent.id);
    } else {
      this.log = options.log || [];
    }
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