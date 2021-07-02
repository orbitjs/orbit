import { Query } from '@orbit/data';
import { InitializedRecord } from './record';
import {
  RecordQueryExpression,
  RecordQueryExpressionResult
} from './record-query-expression';

export type RecordQuery = Query<RecordQueryExpression>;

export type RecordQueryResult<T = InitializedRecord> =
  | RecordQueryExpressionResult<T>
  | RecordQueryExpressionResult<T>[];
