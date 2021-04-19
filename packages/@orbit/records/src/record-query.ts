import { Query } from '@orbit/data';
import { InitializedRecord } from './record';
import {
  RecordQueryExpression,
  RecordQueryExpressionResult
} from './record-query-expression';

export interface RecordQuery extends Query<RecordQueryExpression> {
  expressions: RecordQueryExpression[];
}

export type RecordQueryResult<T = InitializedRecord> =
  | RecordQueryExpressionResult<T>
  | RecordQueryExpressionResult<T>[];
