/* eslint-disable valid-jsdoc */

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
export default class OperationProcessor {
  constructor(cache) {
    this.cache = cache;
  }

  /**
   Called when all the `data` in a cache has been reset.

   The return value is ignored.

   @param  {Object} [data] a complete replacement set of data
   */
  reset(data) {}

  /**
   Called before an `operation` has been applied.

   Return an array of operations to be applied **BEFORE** the `operation` itself
   is applied.

   @param  {Object} [operation]
   @return {Array} an array of operations
   */
  before(operation) {
    return [];
  }

  /**
   Called before an `operation` has been applied.

   Return an array of operations to be applied **AFTER** the `operation` itself
   is applied.

   @param  {Object} [operation]
   @return {Array} an array of operations
   */
  after(operation) {
    return [];
  }

  /**
   Called **AFTER** an `operation` and any related operations have been
   applied.

   Return an array of operations to be applied **AFTER** `operation` itself
   is applied.

   @param  {Object} [operation]
   @return {Array} an array of operations
   */
  finally(operation) {
    return [];
  }
}
