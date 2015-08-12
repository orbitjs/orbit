import { toArray, Class } from './lib/objects';
import { normalizeOperations } from './lib/operations';
import { uuid } from './lib/uuid';

/**
 Transforms represent a set of operations that are applied against a
 source. After a transform has been applied, it should be assigned the
 `result`, a `TransformResult` that represents the result of the transform.

 Transforms are automatically assigned a UUID `id`.

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

  init: function(operations, options) {
    this.operations = [];
    if (operations) this.push(operations);

    options = options || {};

    this.id = options.id || uuid();
  },

  isEmpty: function() {
    return this.operations.length === 0;
  },

  push: function(ops) {
    var normalizedOperations = normalizeOperations( toArray(ops) );
    Array.prototype.push.apply(this.operations, normalizedOperations);
  }
});

export default Transform;
