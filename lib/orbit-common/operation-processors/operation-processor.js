import { Class } from 'orbit/lib/objects';

/**
 Operation processors are used to identify operations that should be performed
 together to ensure that a `Cache` or other container of data remains
 consistent and correct.

 `OperationProcessor` is an abstract base class to be extended by specific
 operation processors.

 @class OperationProcessor
 @namespace OC
 @param {OC.Cache} [cache] Cache that is monitored.
 @constructor
 */
export default Class.extend({
  init: function(cache) {
    this.cache = cache;
  },

  cache: null,

  /**
   Called when all the `data` in a cache has been reset.

   The return value is ignored.

   @param  {Object} [data] a complete replacement set of data
   */
  reset: function(data) {},

  /**
   Called before an `operation` has been applied.

   Return an array of operations to be applied **BEFORE** the `operation` itself
   is applied.

   @param  {OC.Operation} [operation]
   @return {Array} an array of `OC.Operation` objects
   */
  before: function(operation) {
    return [];
  },

  /**
   Called before an `operation` has been applied.

   Return an array of operations to be applied **AFTER** the `operation` itself
   is applied.

   @param  {OC.Operation} [operation]
   @return {Array} an array of `OC.Operation` objects
   */
  after: function(operation) {
    return [];
  },

  /**
   Called **AFTER** an `operation` and any related operations have been
   applied.

   Return an array of operations to be applied **AFTER** `operation` itself
   is applied.

   @param  {OC.Operation} [operation]
   @return {Array} an array of `OC.Operation` objects
   */
  finally: function(operation) {
    return [];
  }
});
