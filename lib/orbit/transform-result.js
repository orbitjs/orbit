import { Class } from './lib/objects';
import { uuid } from './lib/uuid';

/**
 `TransformResult`

 @class TransformResult
 @namespace Orbit
 @param {Transform} [transform] Transform that caused these results
 @param {Array}     [completedOperations] Completed operations
 @param {Array}     [inverseOperations] Inverse operations
 @constructor
 */
export default Class.extend({
  transform: null,

  completedOperations: null,

  inverseOperations: null,

  init: function(transform, completedOperations, inverseOperations) {
    this.transform = transform;
    this.completedOperations = completedOperations || [];
    this.inverseOperations = inverseOperations || [];
  }
});
