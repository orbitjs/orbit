import { Class, toArray } from './lib/objects';
import { uuid } from './lib/uuid';

/**
 `TransformResult` represents the result of applying a transform. The result
 includes an array of completed operations as well as an array of inverse
 operations that could be applied to "undo" the completed operations.

 @class TransformResult
 @namespace Orbit
 @param {Array} [operations] Completed operations
 @param {Array} [inverseOperations] Inverse operations
 @constructor
 */
export default Class.extend({
  operations: null,
  inverseOperations: null,

  init: function(operations, inverseOperations) {
    this.operations = toArray(operations);
    this.inverseOperations = toArray(inverseOperations);
  },

  push: function(operations, inverseOperations) {
    Array.prototype.push.apply(this.operations, toArray(operations));
    Array.prototype.push.apply(this.inverseOperations, toArray(inverseOperations));
  },

  concat: function(result) {
    this.push(result.operations, result.inverseOperations);
  },

  isEmpty: function() {
    return this.operations.length === 0 &&
           this.inverseOperations.length === 0;
  }
});
