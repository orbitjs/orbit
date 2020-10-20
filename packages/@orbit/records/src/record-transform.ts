import { RecordOperation, RecordOperationResult } from './record-operation';
import { Transform } from '@orbit/data';

export interface RecordTransform extends Transform<RecordOperation> {
  operations: RecordOperation[];
}

export type RecordTransformResult =
  | RecordOperationResult
  | RecordOperationResult[];
