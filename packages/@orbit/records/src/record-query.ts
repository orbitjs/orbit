import { Query, QueryOrExpressions } from '@orbit/data';
import { RecordQueryBuilder } from './record-query-builder';
import {
  RecordQueryExpression,
  RecordQueryExpressionResult
} from './record-query-expression';

export interface RecordQuery extends Query<RecordQueryExpression> {
  expressions: RecordQueryExpression[];
}

export type RecordQueryOrExpressions = QueryOrExpressions<
  RecordQueryExpression,
  RecordQueryBuilder
>;

export type RecordQueryResult =
  | RecordQueryExpressionResult
  | RecordQueryExpressionResult[];
