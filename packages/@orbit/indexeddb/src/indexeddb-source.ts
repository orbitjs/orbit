import { Orbit } from '@orbit/core';
import {
  buildTransform,
  pullable,
  pushable,
  Resettable,
  syncable,
  FullResponse,
  DefaultRequestOptions,
  RequestOptions
} from '@orbit/data';
import {
  RecordOperation,
  UpdateRecordOperation,
  RecordQueryExpressionResult,
  RecordSourceSettings,
  RecordPullable,
  RecordPushable,
  RecordSyncable,
  RecordTransform,
  RecordSource,
  RecordQuery,
  RecordSourceQueryOptions
} from '@orbit/records';
import { supportsIndexedDB } from './lib/indexeddb';
import { IndexedDBCache, IndexedDBCacheSettings } from './indexeddb-cache';

const { assert } = Orbit;

export interface IndexedDBSourceSettings extends RecordSourceSettings {
  namespace?: string;
  cacheSettings?: Partial<IndexedDBCacheSettings>;
}

export interface IndexedDBSource
  extends RecordSource,
    RecordSyncable,
    RecordPullable<unknown>,
    RecordPushable<unknown>,
    Resettable {}

/**
 * Source for storing data in IndexedDB.
 */
@pullable
@pushable
@syncable
export class IndexedDBSource extends RecordSource {
  protected _cache: IndexedDBCache;

  constructor(settings: IndexedDBSourceSettings) {
    assert(
      "IndexedDBSource's `schema` must be specified in `settings.schema` constructor argument",
      !!settings.schema
    );
    assert('Your browser does not support IndexedDB!', supportsIndexedDB());

    settings.name = settings.name ?? 'indexedDB';
    const autoActivate = settings.autoActivate !== false;
    settings.autoActivate = false;

    super(settings);

    let cacheSettings: Partial<IndexedDBCacheSettings> =
      settings.cacheSettings ?? {};
    cacheSettings.schema = settings.schema;
    cacheSettings.keyMap = settings.keyMap;
    cacheSettings.queryBuilder =
      cacheSettings.queryBuilder ?? this.queryBuilder;
    cacheSettings.transformBuilder =
      cacheSettings.transformBuilder ?? this.transformBuilder;
    cacheSettings.namespace = cacheSettings.namespace ?? settings.namespace;
    cacheSettings.defaultQueryOptions =
      cacheSettings.defaultQueryOptions ?? settings.defaultQueryOptions;
    cacheSettings.defaultTransformOptions =
      cacheSettings.defaultTransformOptions ?? settings.defaultTransformOptions;

    this._cache = new IndexedDBCache(cacheSettings as IndexedDBCacheSettings);
    if (autoActivate) {
      this.activate();
    }
  }

  get cache(): IndexedDBCache {
    return this._cache;
  }

  get defaultQueryOptions():
    | DefaultRequestOptions<RecordSourceQueryOptions>
    | undefined {
    return super.defaultQueryOptions;
  }

  set defaultQueryOptions(
    options: DefaultRequestOptions<RecordSourceQueryOptions> | undefined
  ) {
    super.defaultQueryOptions = this.cache.defaultQueryOptions = options;
  }

  get defaultTransformOptions():
    | DefaultRequestOptions<RequestOptions>
    | undefined {
    return super.defaultTransformOptions;
  }

  set defaultTransformOptions(
    options: DefaultRequestOptions<RequestOptions> | undefined
  ) {
    this._defaultTransformOptions = this.cache.defaultTransformOptions = options;
  }

  async upgrade(): Promise<void> {
    await this._cache.upgrade();
  }

  protected async _activate(): Promise<void> {
    await super._activate();
    await this.cache.openDB();
  }

  async deactivate(): Promise<void> {
    await super.deactivate();
    await this.cache.closeDB();
  }

  /////////////////////////////////////////////////////////////////////////////
  // Resettable interface implementation
  /////////////////////////////////////////////////////////////////////////////

  async reset(): Promise<void> {
    await this._cache.reset();
  }

  /////////////////////////////////////////////////////////////////////////////
  // Syncable interface implementation
  /////////////////////////////////////////////////////////////////////////////

  async _sync(transform: RecordTransform): Promise<void> {
    if (!this.transformLog.contains(transform.id)) {
      await this._cache.update(transform);
      await this.transformed([transform]);
    }
  }

  /////////////////////////////////////////////////////////////////////////////
  // Pushable interface implementation
  /////////////////////////////////////////////////////////////////////////////

  async _push(
    transform: RecordTransform
  ): Promise<FullResponse<undefined, unknown, RecordOperation>> {
    const fullResponse: FullResponse<undefined, unknown, RecordOperation> = {};

    if (!this.transformLog.contains(transform.id)) {
      await this._cache.update(transform);
      fullResponse.transforms = [transform];
    }

    return fullResponse;
  }

  /////////////////////////////////////////////////////////////////////////////
  // Pullable implementation
  /////////////////////////////////////////////////////////////////////////////

  async _pull(
    query: RecordQuery
  ): Promise<FullResponse<undefined, unknown, RecordOperation>> {
    const fullResponse: FullResponse<undefined, unknown, RecordOperation> = {};
    let operations: RecordOperation[];

    const results = await this._cache.query(query);

    if (query.expressions.length === 1) {
      operations = this._operationsFromQueryResult(
        results as RecordQueryExpressionResult
      );
    } else {
      operations = [];
      for (let result of results as RecordQueryExpressionResult[]) {
        operations.push(...this._operationsFromQueryResult(result));
      }
    }

    fullResponse.transforms = [buildTransform(operations)];

    return fullResponse;
  }

  protected _operationsFromQueryResult(
    result: RecordQueryExpressionResult
  ): RecordOperation[] {
    if (Array.isArray(result)) {
      return result.map((r) => {
        return {
          op: 'updateRecord',
          record: r
        };
      });
    } else if (result) {
      return [
        {
          op: 'updateRecord',
          record: result
        } as UpdateRecordOperation
      ];
    } else {
      return [];
    }
  }
}
