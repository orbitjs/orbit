import { RecordSchema, RecordQuery, RecordQueryResult } from '@orbit/records';
import { AsyncRecordCache } from '../async-record-cache';
import { LiveQuery, LiveQuerySettings } from './live-query';

export interface AsyncLiveQueryUpdateSettings {
  cache: AsyncRecordCache;
  query: RecordQuery;
}

export class AsyncLiveQueryUpdate {
  private _cache: AsyncRecordCache;
  private _query: RecordQuery;

  constructor(settings: AsyncLiveQueryUpdateSettings) {
    this._cache = settings.cache;
    this._query = settings.query;
  }

  query<
    Result extends RecordQueryResult = RecordQueryResult
  >(): Promise<Result> {
    return this._cache.query(this._query);
  }
}

export interface AsyncLiveQuerySettings extends LiveQuerySettings {
  cache: AsyncRecordCache;
}

export class AsyncLiveQuery extends LiveQuery {
  protected cache: AsyncRecordCache;

  protected get schema(): RecordSchema {
    return this.cache.schema;
  }

  private get _update() {
    return new AsyncLiveQueryUpdate({
      cache: this.cache,
      query: this._query
    });
  }

  constructor(settings: AsyncLiveQuerySettings) {
    super(settings);
    this.cache = settings.cache;
  }

  query<
    Result extends RecordQueryResult = RecordQueryResult
  >(): Promise<Result> {
    return this._update.query();
  }

  subscribe(cb: (update: AsyncLiveQueryUpdate) => void): () => void {
    return this._subscribe(() => {
      cb(this._update);
    });
  }
}
