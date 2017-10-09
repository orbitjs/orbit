import Cache from '../../cache';
import { RecordOperation } from '@orbit/data';

export interface OperationProcessorClass {
  new (cache: Cache): OperationProcessor;
}

/**
 * Operation processors are used to identify operations that should be performed
 * together to ensure that a `Cache` or other container of data remains
 * consistent and correct.
 *
 * `OperationProcessor` is an abstract base class to be extended by specific
 * operation processors.
 *
 * @export
 * @abstract
 * @class OperationProcessor
 */
export abstract class OperationProcessor {
  private _cache: Cache;

  /**
   * The `Cache` that is monitored.
   *
   * @readonly
   * @memberof OperationProcessor
   */
  get cache() {
    return this._cache;
  }

  /**
   * Creates an instance of OperationProcessor.
   *
   * @param {Cache} cache
   * @memberof OperationProcessor
   */
  constructor(cache: Cache) {
    this._cache = cache;
  }

  /**
   * Called when all the data in a cache has been reset.
   *
   * If `base` is included, the cache is being reset to match a base cache.
   *
   * @param {Cache} [base]
   * @memberof OperationProcessor
   */
  reset(base?: Cache): void {}

  /**
   * Allow the processor to perform an upgrade as part of a cache upgrade.
   *
   * @memberof OperationProcessor
   */
  upgrade(): void {}

  /**
   * Validates an operation before processing it.
   *
   * @param {RecordOperation} operation
   * @memberof OperationProcessor
   */
  validate(operation: RecordOperation): void {}

  /**
   * Called before an `operation` has been applied.
   *
   * Returns an array of operations to be applied **BEFORE** the `operation`
   * itself is applied.
   *
   * @param {RecordOperation} operation
   * @returns {RecordOperation[]}
   * @memberof OperationProcessor
   */
  before(operation: RecordOperation): RecordOperation[] {
    return [];
  }

  /**
   * Called before an `operation` has been applied.
   *
   * Returns an array of operations to be applied **AFTER** the `operation`
   * has been applied successfully.
   *
   * @param {RecordOperation} operation
   * @returns {RecordOperation[]}
   * @memberof OperationProcessor
   */
  after(operation: RecordOperation): RecordOperation[] {
    return [];
  }

  /**
   * Called immediately after an `operation` has been applied and before the
   * `patch` event has been emitted (i.e. before any listeners have been
   * notified that the operation was applied).
   *
   * No operations may be returned.
   *
   * @param {RecordOperation} operation
   * @memberof OperationProcessor
   */
  immediate(operation: RecordOperation): void {
  }

  /**
   * Called after an `operation` _and_ any related operations have been applied.
   *
   * Returns an array of operations to be applied **AFTER** the `operation`
   * itself and any operations returned from the `after` hook have been applied.
   *
   * @param {RecordOperation} operation
   * @returns {RecordOperation[]}
   * @memberof OperationProcessor
   */
  finally(operation: RecordOperation): RecordOperation[] {
    return [];
  }
}
