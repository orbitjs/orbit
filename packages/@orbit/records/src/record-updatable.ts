import { AsyncUpdatable, RequestOptions, SyncUpdatable } from '@orbit/data';
import { RecordOperation } from './record-operation';
import { RecordTransformResult } from './record-transform';
import { RecordTransformBuilder } from './record-transform-builder';

export type SyncRecordUpdatable<
  ResponseDetails,
  TransformBuilder = RecordTransformBuilder,
  TransformOptions extends RequestOptions = RequestOptions
> = SyncUpdatable<
  RecordTransformResult,
  ResponseDetails,
  RecordOperation,
  TransformBuilder,
  TransformOptions
>;

export type AsyncRecordUpdatable<
  ResponseDetails,
  TransformBuilder = RecordTransformBuilder,
  TransformOptions extends RequestOptions = RequestOptions
> = AsyncUpdatable<
  RecordTransformResult,
  ResponseDetails,
  RecordOperation,
  TransformBuilder,
  TransformOptions
>;
