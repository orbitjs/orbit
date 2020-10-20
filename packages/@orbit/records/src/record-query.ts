import { Query } from '@orbit/data';
import {
  RecordQueryExpression,
  RecordQueryExpressionResult
} from './record-query-expression';

export interface RecordQuery extends Query<RecordQueryExpression> {
  expressions: RecordQueryExpression[];
}

export type RecordQueryResult =
  | RecordQueryExpressionResult
  | RecordQueryExpressionResult[];
