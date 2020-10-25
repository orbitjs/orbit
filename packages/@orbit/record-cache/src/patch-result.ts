import { RecordOperation, RecordOperationResult } from '@orbit/records';

export interface PatchResult {
  inverse: RecordOperation[];
  data: RecordOperationResult[];
}
