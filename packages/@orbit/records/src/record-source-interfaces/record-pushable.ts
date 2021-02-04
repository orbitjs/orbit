import { Pushable } from '@orbit/data';
import { RecordOperation } from '../record-operation';
import { RecordTransformResult } from '../record-transform';
import { RecordTransformBuilder } from '../record-transform-builder';

export type RecordPushable<ResponseDetails> = Pushable<
  RecordTransformResult,
  ResponseDetails,
  RecordOperation,
  RecordTransformBuilder
>;
