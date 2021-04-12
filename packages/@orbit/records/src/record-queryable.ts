import { AsyncQueryable, RequestOptions, SyncQueryable } from '@orbit/data';
import { RecordOperation } from './record-operation';
import { RecordQueryResult } from './record-query';
import { RecordQueryBuilder } from './record-query-builder';
import { RecordQueryExpression } from './record-query-expression';

export type SyncRecordQueryable<
  ResponseDetails,
  QueryBuilder = RecordQueryBuilder,
  QueryOptions extends RequestOptions = RequestOptions
> = SyncQueryable<
  RecordQueryResult,
  ResponseDetails,
  RecordOperation,
  RecordQueryExpression,
  QueryBuilder,
  QueryOptions
>;

export type AsyncRecordQueryable<
  ResponseDetails,
  QueryBuilder = RecordQueryBuilder,
  QueryOptions extends RequestOptions = RequestOptions
> = AsyncQueryable<
  RecordQueryResult,
  ResponseDetails,
  RecordOperation,
  RecordQueryExpression,
  QueryBuilder,
  QueryOptions
>;
