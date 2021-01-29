import { DataOrFullResponse } from '@orbit/data';
import {
  RecordSchema,
  RecordQuery,
  RecordQueryResult,
  RecordOperation
} from '@orbit/records';
import { SyncRecordCache } from '../sync-record-cache';
import { LiveQuery, LiveQuerySettings } from './live-query';

export interface SyncLiveQueryUpdateSettings {
  cache: SyncRecordCache;
  query: RecordQuery;
}

export class SyncLiveQueryUpdate {
  private _cache: SyncRecordCache;
  private _query: RecordQuery;

  constructor(settings: SyncLiveQueryUpdateSettings) {
    this._cache = settings.cache;
    this._query = settings.query;
  }

  query(): DataOrFullResponse<RecordQueryResult, undefined, RecordOperation> {
    return this._cache.query(this._query);
  }
}

export interface SyncLiveQuerySettings extends LiveQuerySettings {
  cache: SyncRecordCache;
}

export class SyncLiveQuery extends LiveQuery {
  protected cache: SyncRecordCache;

  protected get schema(): RecordSchema {
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

  query(): DataOrFullResponse<RecordQueryResult, undefined, RecordOperation> {
    return this._update.query();
  }

  subscribe(cb: (update: SyncLiveQueryUpdate) => void): () => void {
    return this._subscribe(() => {
      cb(this._update);
    });
  }
}
