import { RequestOptions } from '@orbit/data';
import {
  RecordQuery,
  RecordQueryBuilder,
  RecordQueryResult,
  RecordSchema,
  RecordTransformBuilder
} from '@orbit/records';
import {
  RecordCacheQueryOptions,
  RecordCacheTransformOptions
} from '../record-cache';
import { SyncRecordCache } from '../sync-record-cache';
import { LiveQuery, LiveQuerySettings } from './live-query';

export interface SyncLiveQueryUpdateSettings<
  QO extends RequestOptions = RecordCacheQueryOptions,
  TO extends RequestOptions = RecordCacheTransformOptions,
  QB = RecordQueryBuilder,
  TB = RecordTransformBuilder
> {
  cache: SyncRecordCache<QO, TO, QB, TB>;
  query: RecordQuery;
}

export class SyncLiveQueryUpdate<
  QO extends RequestOptions = RecordCacheQueryOptions,
  TO extends RequestOptions = RecordCacheTransformOptions,
  QB = RecordQueryBuilder,
  TB = RecordTransformBuilder
> {
  private _cache: SyncRecordCache<QO, TO, QB, TB>;
  private _query: RecordQuery;

  constructor(settings: SyncLiveQueryUpdateSettings<QO, TO, QB, TB>) {
    this._cache = settings.cache;
    this._query = settings.query;
  }

  query<Result extends RecordQueryResult = RecordQueryResult>(): Result {
    return this._cache.query(this._query);
  }
}

export interface SyncLiveQuerySettings<
  QO extends RequestOptions = RecordCacheQueryOptions,
  TO extends RequestOptions = RecordCacheTransformOptions,
  QB = RecordQueryBuilder,
  TB = RecordTransformBuilder
> extends LiveQuerySettings {
  cache: SyncRecordCache<QO, TO, QB, TB>;
}

export class SyncLiveQuery<
  QO extends RequestOptions = RecordCacheQueryOptions,
  TO extends RequestOptions = RecordCacheTransformOptions,
  QB = RecordQueryBuilder,
  TB = RecordTransformBuilder
> extends LiveQuery {
  protected cache: SyncRecordCache<QO, TO, QB, TB>;

  protected get schema(): RecordSchema {
    return this.cache.schema;
  }

  private get _update() {
    return new SyncLiveQueryUpdate<QO, TO, QB, TB>({
      cache: this.cache,
      query: this._query
    });
  }

  constructor(settings: SyncLiveQuerySettings<QO, TO, QB, TB>) {
    super(settings);
    this.cache = settings.cache;
  }

  query<Result extends RecordQueryResult = RecordQueryResult>(): Result {
    return this._update.query<Result>();
  }

  subscribe(
    cb: (update: SyncLiveQueryUpdate<QO, TO, QB, TB>) => void
  ): () => void {
    return this._subscribe(() => {
      cb(this._update);
    });
  }
}
