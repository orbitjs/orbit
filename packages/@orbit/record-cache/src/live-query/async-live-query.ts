import { RequestOptions } from '@orbit/data';
import {
  RecordQuery,
  RecordQueryBuilder,
  RecordQueryResult,
  RecordSchema,
  RecordTransformBuilder
} from '@orbit/records';
import { AsyncRecordCache } from '../async-record-cache';
import {
  RecordCacheQueryOptions,
  RecordCacheTransformOptions
} from '../record-cache';
import { LiveQuery, LiveQuerySettings } from './live-query';

export interface AsyncLiveQueryUpdateSettings<
  QO extends RequestOptions = RecordCacheQueryOptions,
  TO extends RequestOptions = RecordCacheTransformOptions,
  QB = RecordQueryBuilder,
  TB = RecordTransformBuilder
> {
  cache: AsyncRecordCache<QO, TO, QB, TB>;
  query: RecordQuery;
}

export class AsyncLiveQueryUpdate<
  QO extends RequestOptions = RecordCacheQueryOptions,
  TO extends RequestOptions = RecordCacheTransformOptions,
  QB = RecordQueryBuilder,
  TB = RecordTransformBuilder
> {
  private _cache: AsyncRecordCache<QO, TO, QB, TB>;
  private _query: RecordQuery;

  constructor(settings: AsyncLiveQueryUpdateSettings<QO, TO, QB, TB>) {
    this._cache = settings.cache;
    this._query = settings.query;
  }

  query<
    Result extends RecordQueryResult = RecordQueryResult
  >(): Promise<Result> {
    return this._cache.query(this._query);
  }
}

export interface AsyncLiveQuerySettings<
  QO extends RequestOptions = RecordCacheQueryOptions,
  TO extends RequestOptions = RecordCacheTransformOptions,
  QB = RecordQueryBuilder,
  TB = RecordTransformBuilder
> extends LiveQuerySettings {
  cache: AsyncRecordCache<QO, TO, QB, TB>;
}

export class AsyncLiveQuery<
  QO extends RequestOptions = RecordCacheQueryOptions,
  TO extends RequestOptions = RecordCacheTransformOptions,
  QB = RecordQueryBuilder,
  TB = RecordTransformBuilder
> extends LiveQuery {
  protected cache: AsyncRecordCache<QO, TO, QB, TB>;

  protected get schema(): RecordSchema {
    return this.cache.schema;
  }

  private get _update() {
    return new AsyncLiveQueryUpdate<QO, TO, QB, TB>({
      cache: this.cache,
      query: this._query
    });
  }

  constructor(settings: AsyncLiveQuerySettings<QO, TO, QB, TB>) {
    super(settings);
    this.cache = settings.cache;
  }

  query<
    Result extends RecordQueryResult = RecordQueryResult
  >(): Promise<Result> {
    return this._update.query();
  }

  subscribe(
    cb: (update: AsyncLiveQueryUpdate<QO, TO, QB, TB>) => void
  ): () => void {
    return this._subscribe(() => {
      cb(this._update);
    });
  }
}
