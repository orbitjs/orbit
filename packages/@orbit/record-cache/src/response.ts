import { RecordOperation, RecordOperationResult } from '@orbit/records';

/**
 * @deprecated since v0.17
 */
export interface PatchResult {
  inverse: RecordOperation[];
  data: RecordOperationResult[];
}

export interface RecordCacheUpdateDetails {
  appliedOperations: RecordOperation[];
  appliedOperationResults: RecordOperationResult[];
  inverseOperations: RecordOperation[];
}
