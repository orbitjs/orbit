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
  Record,
  RecordIdentity,
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
import { supportsLocalStorage } from './lib/local-storage';
import {
  LocalStorageCache,
  LocalStorageCacheSettings
} from './local-storage-cache';

const { assert } = Orbit;

export interface LocalStorageSourceSettings extends RecordSourceSettings {
  delimiter?: string;
  namespace?: string;
  cacheSettings?: Partial<LocalStorageCacheSettings>;
}

export interface LocalStorageSource
  extends RecordSource,
    RecordSyncable,
    RecordPullable<unknown>,
    RecordPushable<unknown>,
    Resettable {}

/**
 * Source for storing data in localStorage.
 */
@pullable
@pushable
@syncable
export class LocalStorageSource extends RecordSource {
  protected _cache: LocalStorageCache;

  constructor(settings: LocalStorageSourceSettings) {
    assert(
      "LocalStorageSource's `schema` must be specified in `settings.schema` constructor argument",
      !!settings.schema
    );
    assert(
      'Your browser does not support local storage!',
      supportsLocalStorage()
    );

    settings.name = settings.name ?? 'localStorage';

    super(settings);

    let cacheSettings: Partial<LocalStorageCacheSettings> =
      settings.cacheSettings ?? {};
    cacheSettings.schema = settings.schema;
    cacheSettings.keyMap = settings.keyMap;
    cacheSettings.queryBuilder =
      cacheSettings.queryBuilder ?? this.queryBuilder;
    cacheSettings.transformBuilder =
      cacheSettings.transformBuilder ?? this.transformBuilder;
    cacheSettings.defaultQueryOptions =
      cacheSettings.defaultQueryOptions ?? settings.defaultQueryOptions;
    cacheSettings.defaultTransformOptions =
      cacheSettings.defaultTransformOptions ?? settings.defaultTransformOptions;
    cacheSettings.namespace = cacheSettings.namespace ?? settings.namespace;
    cacheSettings.delimiter = cacheSettings.delimiter ?? settings.delimiter;

    this._cache = new LocalStorageCache(
      cacheSettings as LocalStorageCacheSettings
    );
  }

  get cache(): LocalStorageCache {
    return this._cache;
  }

  get namespace(): string {
    return this._cache.namespace;
  }

  get delimiter(): string {
    return this._cache.delimiter;
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

  getKeyForRecord(record: RecordIdentity | Record): string {
    return this._cache.getKeyForRecord(record);
  }

  async upgrade(): Promise<void> {
    this._cache.upgrade();
  }

  /////////////////////////////////////////////////////////////////////////////
  // Resettable interface implementation
  /////////////////////////////////////////////////////////////////////////////

  async reset(): Promise<void> {
    this._cache.reset();
  }

  /////////////////////////////////////////////////////////////////////////////
  // Syncable interface implementation
  /////////////////////////////////////////////////////////////////////////////

  async _sync(transform: RecordTransform): Promise<void> {
    if (!this.transformLog.contains(transform.id)) {
      this._cache.update(transform);
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
      this._cache.update(transform);
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

    const results = this._cache.query(query);

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
