import { Orbit } from '@orbit/core';
import {
  buildTransform,
  pullable,
  pushable,
  queryable,
  Resettable,
  syncable,
  updatable,
  FullResponse,
  DefaultRequestOptions,
  RequestOptions,
  ResponseHints
} from '@orbit/data';
import {
  InitializedRecord,
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
  RecordSourceQueryOptions,
  RecordUpdatable,
  RecordQueryable,
  RecordQueryResult,
  RecordTransformResult,
  RecordOperationResult
} from '@orbit/records';
import { supportsLocalStorage } from './lib/local-storage';
import {
  LocalStorageCache,
  LocalStorageCacheClass,
  LocalStorageCacheSettings
} from './local-storage-cache';

const { assert } = Orbit;

export interface LocalStorageSourceSettings extends RecordSourceSettings {
  delimiter?: string;
  namespace?: string;
  cacheClass?: LocalStorageCacheClass;
  cacheSettings?: Partial<LocalStorageCacheSettings>;
}

export interface LocalStorageSource
  extends RecordSource,
    RecordSyncable,
    RecordPullable<unknown>,
    RecordPushable<unknown>,
    RecordQueryable<unknown>,
    RecordUpdatable<unknown>,
    Resettable {}

/**
 * Source for storing data in localStorage.
 */
@pullable
@pushable
@queryable
@updatable
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

    const cacheClass = settings.cacheClass ?? LocalStorageCache;
    this._cache = new cacheClass(cacheSettings as LocalStorageCacheSettings);
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

  getKeyForRecord(record: RecordIdentity | InitializedRecord): string {
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
  // Updatable interface implementation
  /////////////////////////////////////////////////////////////////////////////

  async _update(
    transform: RecordTransform,
    hints?: ResponseHints<RecordTransformResult, unknown>
  ): Promise<FullResponse<RecordTransformResult, unknown, RecordOperation>> {
    let results: RecordTransformResult;
    const response: FullResponse<
      RecordTransformResult,
      unknown,
      RecordOperation
    > = {};

    if (!this.transformLog.contains(transform.id)) {
      results = this._applyTransform(transform);
      response.transforms = [transform];
    }

    if (hints?.data) {
      if (transform.operations.length > 1 && Array.isArray(hints.data)) {
        response.data = (hints.data as RecordOperationResult[]).map((h) =>
          this._retrieveOperationResult(h)
        );
      } else {
        response.data = this._retrieveOperationResult(
          hints.data as RecordOperationResult
        );
      }
    } else if (results) {
      if (transform.operations.length === 1 && Array.isArray(results)) {
        response.data = results[0];
      } else {
        response.data = results;
      }
    }

    if (hints?.details) {
      response.details = hints.details;
    }

    return response;
  }

  /////////////////////////////////////////////////////////////////////////////
  // Queryable interface implementation
  /////////////////////////////////////////////////////////////////////////////

  async _query(
    query: RecordQuery,
    hints?: ResponseHints<RecordQueryResult, unknown>
  ): Promise<FullResponse<RecordQueryResult, unknown, RecordOperation>> {
    let response: FullResponse<RecordQueryResult, unknown, RecordOperation>;

    if (hints?.data) {
      response = {};
      if (query.expressions.length > 1 && Array.isArray(hints.data)) {
        response.data = (hints.data as RecordQueryExpressionResult[]).map((h) =>
          this._retrieveQueryExpressionResult(h)
        );
      } else {
        response.data = this._retrieveQueryExpressionResult(
          hints.data as RecordQueryExpressionResult
        );
      }
    } else {
      response = this._cache.query(query, { fullResponse: true });
    }

    if (hints?.details) {
      response.details = hints.details;
    }

    return response;
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

  /////////////////////////////////////////////////////////////////////////////
  // Protected methods
  /////////////////////////////////////////////////////////////////////////////

  protected _retrieveQueryExpressionResult(
    result: RecordQueryExpressionResult
  ): RecordQueryExpressionResult {
    if (Array.isArray(result)) {
      return this._cache.getRecordsSync(result);
    } else if (result) {
      return this._cache.getRecordSync(result);
    } else {
      return result;
    }
  }

  protected _retrieveOperationResult(
    result: RecordOperationResult
  ): RecordOperationResult {
    if (result) {
      return this._cache.getRecordSync(result);
    } else {
      return result;
    }
  }

  protected _applyTransform(transform: RecordTransform): RecordTransformResult {
    return this.cache.update(transform);
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
