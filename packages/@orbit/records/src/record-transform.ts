import { RecordOperation, RecordOperationResult } from './record-operation';
import { InitializedRecord } from './record';
import { Transform } from '@orbit/data';

export interface RecordTransform extends Transform<RecordOperation> {
  operations: RecordOperation[];
}

export type RecordTransformResult<T = InitializedRecord> =
  | RecordOperationResult<T>
  | RecordOperationResult<T>[];
