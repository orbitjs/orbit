import { RecordOperation, RecordOperationResult } from './record-operation';
import { FullResponse, Transform, TransformOrOperations } from '@orbit/data';
import { RecordTransformBuilder } from './record-transform-builder';

export interface RecordTransform extends Transform<RecordOperation> {
  operations: RecordOperation[];
}

export type RecordTransformOrOperations = TransformOrOperations<
  RecordOperation,
  RecordTransformBuilder
>;

export type RecordTransformResult =
  | RecordOperationResult
  | RecordOperationResult[];

export type RecordTransformFullResponse<Details> = FullResponse<
  RecordOperationResult,
  Details,
  RecordOperation
>;
