import { RecordOperation, RecordOperationResult } from '@orbit/data';

export interface PatchResult {
  inverse: RecordOperation[];
  data: RecordOperationResult[];
}
