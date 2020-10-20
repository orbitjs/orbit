import { Schema, Query, RecordQueryResult } from '@orbit/data';
import { SyncRecordCache } from '../sync-record-cache';
import { LiveQuery, LiveQuerySettings } from './live-query';

export interface SyncLiveQueryUpdateSettings {
  cache: SyncRecordCache;
  query: Query;
}

export class SyncLiveQueryUpdate {
  private _cache: SyncRecordCache;
  private _query: Query;

  constructor(settings: SyncLiveQueryUpdateSettings) {
    this._cache = settings.cache;
    this._query = settings.query;
  }

  query(): RecordQueryResult {
    return this._cache.query(this._query);
  }
}

export interface SyncLiveQuerySettings extends LiveQuerySettings {
  cache: SyncRecordCache;
}

export class SyncLiveQuery extends LiveQuery {
  protected cache: SyncRecordCache;

  protected get schema(): Schema {
    return this.cache.schema;
  }

  private get _update() {
    return new SyncLiveQueryUpdate({
      cache: this.cache,
      query: this._query
    });
  }

  constructor(settings: SyncLiveQuerySettings) {
    super(settings);
    this.cache = settings.cache;
  }

  query(): RecordQueryResult {
    return this._update.query();
  }

  subscribe(cb: (update: SyncLiveQueryUpdate) => void): () => void {
    return this._subscribe(() => {
      cb(this._update);
    });
  }
}
