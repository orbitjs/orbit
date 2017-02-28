import Cache from '../../cache';
import { RecordOperation } from '@orbit/core';

export interface OperationProcessorClass {
  new (cache: Cache): OperationProcessor;
}

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
export abstract class OperationProcessor {
  cache: Cache;

  constructor(cache: Cache) {
    this.cache = cache;
  }

  /**
   Called when all the data in a cache has been reset.

   The return value is ignored.
   */
  reset(): void {}

  /**
   Called before an `operation` has been applied.

   Return an array of operations to be applied **BEFORE** the `operation` itself
   is applied.

   @param  {Object} [operation]
   @return {Array} an array of operations
   */
  before(operation: RecordOperation): RecordOperation[] {
    return [];
  }

  /**
   Called before an `operation` has been applied.

   Return an array of operations to be applied **AFTER** the `operation` itself
   is applied.

   @param  {Object} [operation]
   @return {Array} an array of operations
   */
  after(operation: RecordOperation): RecordOperation[] {
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
  finally(operation: RecordOperation): RecordOperation[] {
    return [];
  }
}
