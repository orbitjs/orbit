import { Pullable } from '@orbit/data';
import { RecordOperation } from '../record-operation';
import { RecordQueryResult } from '../record-query';
import { RecordQueryBuilder } from '../record-query-builder';
import { RecordQueryExpression } from '../record-query-expression';

export type RecordPullable<ResponseDetails> = Pullable<
  RecordQueryResult,
  ResponseDetails,
  RecordOperation,
  RecordQueryExpression,
  RecordQueryBuilder
>;
