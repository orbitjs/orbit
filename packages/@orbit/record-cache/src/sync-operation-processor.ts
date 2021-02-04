/* eslint-disable @typescript-eslint/no-unused-vars */
import { SyncRecordAccessor } from './record-accessor';
import { RecordOperation } from '@orbit/records';

export interface SyncOperationProcessorClass {
  new (cache: SyncRecordAccessor): SyncOperationProcessor;
}

/**
 * Operation processors are used to identify operations that should be performed
 * together to ensure that a `Cache` or other container of data remains
 * consistent and correct.
 *
 * `OperationProcessor` is an abstract base class to be extended by specific
 * operation processors.
 */
export abstract class SyncOperationProcessor {
  private _accessor: SyncRecordAccessor;

  /**
   * The `SyncRecordAccessor` that is monitored.
   */
  get accessor(): SyncRecordAccessor {
    return this._accessor;
  }

  constructor(accessor: SyncRecordAccessor) {
    this._accessor = accessor;
  }

  /**
   * Called when all the data in a cache has been reset.
   *
   * If `base` is included, the cache is being reset to match a base cache.
   */
  reset(base?: SyncRecordAccessor): void {}

  /**
   * Allow the processor to perform an upgrade as part of a cache upgrade.
   */
  upgrade(): void {}

  /**
   * Validates an operation before processing it.
   */
  validate(operation: RecordOperation): void {}

  /**
   * Called before an `operation` has been applied.
   *
   * Returns an array of operations to be applied **BEFORE** the `operation`
   * itself is applied.
   */
  before(operation: RecordOperation): RecordOperation[] {
    return [];
  }

  /**
   * Called before an `operation` has been applied.
   *
   * Returns an array of operations to be applied **AFTER** the `operation`
   * has been applied successfully.
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
   */
  immediate(operation: RecordOperation): void {}

  /**
   * Called after an `operation` _and_ any related operations have been applied.
   *
   * Returns an array of operations to be applied **AFTER** the `operation`
   * itself and any operations returned from the `after` hook have been applied.
   */
  finally(operation: RecordOperation): RecordOperation[] {
    return [];
  }
}
