import { Pullable } from '@orbit/data';
import { RecordOperation } from '../record-operation';
import { RecordQueryBuilder } from '../record-query-builder';
import { RecordQueryExpression } from '../record-query-expression';

export type RecordPullable<ResponseDetails> = Pullable<
  ResponseDetails,
  RecordOperation,
  RecordQueryExpression,
  RecordQueryBuilder
>;
