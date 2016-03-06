import { toArray, Class } from './lib/objects';
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
 @constructor
 */
var Transform = Class.extend({
  operations: null,

  init: function(ops, options) {
    this.operations = toArray(ops);

    options = options || {};

    this.id = options.id || uuid();
  },

  isEmpty: function() {
    return this.operations.length === 0;
  }
});

export default Transform;
