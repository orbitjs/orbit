import { RecordOperation, RecordOperationResult } from '@orbit/records';

export interface RecordCacheUpdateDetails {
  appliedOperations: RecordOperation[];
  appliedOperationResults: RecordOperationResult[];
  inverseOperations: RecordOperation[];
}
