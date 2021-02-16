import { Orbit } from '@orbit/core';
import {
  buildTransform,
  DefaultRequestOptions,
  FullResponse,
  pullable,
  pushable,
  queryable,
  RequestOptions,
  Resettable,
  ResponseHints,
  syncable,
  updatable
} from '@orbit/data';
import {
  RecordOperation,
  RecordOperationResult,
  RecordPullable,
  RecordPushable,
  RecordQuery,
  RecordQueryable,
  RecordQueryExpressionResult,
  RecordQueryResult,
  RecordSource,
  RecordSourceQueryOptions,
  RecordSourceSettings,
  RecordSyncable,
  RecordTransform,
  RecordTransformResult,
  RecordUpdatable,
  UpdateRecordOperation
} from '@orbit/records';
import { IndexedDBCache, IndexedDBCacheSettings } from './indexeddb-cache';
import { supportsIndexedDB } from './lib/indexeddb';

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
    RecordQueryable<unknown>,
    RecordUpdatable<unknown>,
    Resettable {}

/**
 * Source for storing data in IndexedDB.
 */
@pullable
@pushable
@queryable
@updatable
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
      await this._applyTransform(transform);
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
      results = await this._applyTransform(transform);
      response.transforms = [transform];
    }

    if (hints?.data) {
      if (transform.operations.length > 1 && Array.isArray(hints.data)) {
        const responseData = [];
        const hintsData = hints.data as RecordOperationResult[];
        for (let h of hintsData) {
          responseData.push(await this._retrieveOperationResult(h));
        }
        response.data = responseData;
      } else {
        response.data = await this._retrieveOperationResult(
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
        const responseData = [];
        const hintsData = hints.data as RecordQueryExpressionResult[];
        for (let h of hintsData) {
          responseData.push(await this._retrieveQueryExpressionResult(h));
        }
        response.data = responseData;
      } else {
        response.data = await this._retrieveQueryExpressionResult(
          hints.data as RecordQueryExpressionResult
        );
      }
    } else {
      response = await this._cache.query(query, { fullResponse: true });
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

  /////////////////////////////////////////////////////////////////////////////
  // Protected methods
  /////////////////////////////////////////////////////////////////////////////

  protected async _retrieveQueryExpressionResult(
    result: RecordQueryExpressionResult
  ): Promise<RecordQueryExpressionResult> {
    if (Array.isArray(result)) {
      return this._cache.getRecordsAsync(result);
    } else if (result) {
      return this._cache.getRecordAsync(result);
    } else {
      return result;
    }
  }

  protected async _retrieveOperationResult(
    result: RecordOperationResult
  ): Promise<RecordOperationResult> {
    if (result) {
      return this._cache.getRecordAsync(result);
    } else {
      return result;
    }
  }

  protected async _applyTransform(
    transform: RecordTransform
  ): Promise<RecordTransformResult> {
    return await this.cache.update(transform);
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
