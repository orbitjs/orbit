import { RequestOptions, Updatable } from '@orbit/data';
import { RecordOperation } from '../record-operation';
import { RecordTransformResult } from '../record-transform';
import { RecordTransformBuilder } from '../record-transform-builder';

export type RecordUpdatable<
  ResponseDetails,
  TransformBuilder = RecordTransformBuilder,
  TransformOptions extends RequestOptions = RequestOptions
> = Updatable<
  RecordTransformResult,
  ResponseDetails,
  RecordOperation,
  TransformBuilder,
  TransformOptions
>;
