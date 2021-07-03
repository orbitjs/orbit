import { RecordOperation, RecordOperationResult } from './record-operation';
import { InitializedRecord } from './record';
import { Transform } from '@orbit/data';

export type RecordTransform = Transform<RecordOperation>;

export type RecordTransformResult<T = InitializedRecord> =
  | RecordOperationResult<T>
  | RecordOperationResult<T>[];
