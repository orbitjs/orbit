import { Schema, Query, RecordQueryResult } from '@orbit/data';
import { AsyncRecordCache } from '../async-record-cache';
import { LiveQuery, LiveQuerySettings } from './live-query';

export interface AsyncLiveQueryUpdateSettings {
  cache: AsyncRecordCache;
  query: Query;
}

export class AsyncLiveQueryUpdate {
  private _cache: AsyncRecordCache;
  private _query: Query;

  constructor(settings: AsyncLiveQueryUpdateSettings) {
    this._cache = settings.cache;
    this._query = settings.query;
  }

  query(): Promise<RecordQueryResult> {
    return this._cache.query(this._query);
  }
}

export interface AsyncLiveQuerySettings extends LiveQuerySettings {
  cache: AsyncRecordCache;
}

export class AsyncLiveQuery extends LiveQuery {
  protected cache: AsyncRecordCache;

  protected get schema(): Schema {
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

  async query(): Promise<RecordQueryResult> {
    return this._update.query();
  }

  subscribe(cb: (update: AsyncLiveQueryUpdate) => void): () => void {
    return this._subscribe(() => {
      cb(this._update);
    });
  }
}
