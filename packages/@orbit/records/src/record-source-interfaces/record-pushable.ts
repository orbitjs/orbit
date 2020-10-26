import { Pushable } from '@orbit/data';
import { RecordOperation } from '../record-operation';
import { RecordTransformBuilder } from '../record-transform-builder';

export type RecordPushable<ResponseDetails> = Pushable<
  ResponseDetails,
  RecordOperation,
  RecordTransformBuilder
>;
