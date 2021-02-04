import { Updatable } from '@orbit/data';
import { RecordOperation } from '../record-operation';
import { RecordTransformResult } from '../record-transform';
import { RecordTransformBuilder } from '../record-transform-builder';

export type RecordUpdatable<ResponseDetails> = Updatable<
  RecordTransformResult,
  ResponseDetails,
  RecordOperation,
  RecordTransformBuilder
>;
