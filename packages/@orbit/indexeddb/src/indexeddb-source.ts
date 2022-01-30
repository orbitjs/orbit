import { Orbit } from '@orbit/core';
import {
  buildTransform,
  DefaultRequestOptions,
  FullRequestOptions,
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
import { RecordCacheUpdateDetails } from '@orbit/record-cache';
import {
  RecordOperation,
  RecordOperationResult,
  RecordPullable,
  RecordPushable,
  RecordQuery,
  RecordQueryable,
  RecordQueryBuilder,
  RecordQueryExpressionResult,
  RecordQueryResult,
  RecordSource,
  RecordSourceQueryOptions,
  RecordSourceSettings,
  RecordSyncable,
  RecordTransform,
  RecordTransformBuilder,
  RecordTransformResult,
  RecordUpdatable,
  UpdateRecordOperation
} from '@orbit/records';
import {
  IndexedDBCache,
  IndexedDBCacheClass,
  IndexedDBCacheSettings
} from './indexeddb-cache';
import { supportsIndexedDB } from './lib/indexeddb';

const { assert } = Orbit;

export interface IndexedDBSourceSettings<
  QO extends RequestOptions = RecordSourceQueryOptions,
  TO extends RequestOptions = RequestOptions,
  QB = RecordQueryBuilder,
  TB = RecordTransformBuilder,
  QRD = unknown,
  TRD extends RecordCacheUpdateDetails = RecordCacheUpdateDetails
> extends RecordSourceSettings<QO, TO, QB, TB> {
  namespace?: string;
  cacheClass?: IndexedDBCacheClass<QO, TO, QB, TB, QRD, TRD>;
  cacheSettings?: Partial<IndexedDBCacheSettings<QO, TO, QB, TB>>;
}

export interface IndexedDBSource<
  QO extends RequestOptions = RecordSourceQueryOptions,
  TO extends RequestOptions = RequestOptions,
  QB = RecordQueryBuilder,
  TB = RecordTransformBuilder,
  QRD = unknown,
  TRD extends RecordCacheUpdateDetails = RecordCacheUpdateDetails
> extends RecordSource<QO, TO, QB, TB>,
    RecordSyncable,
    RecordPullable<QRD>,
    RecordPushable<TRD>,
    RecordQueryable<QRD, QB, QO>,
    RecordUpdatable<TRD, TB, TO>,
    Resettable {}

/**
 * Source for storing data in IndexedDB.
 */
@pullable
@pushable
@queryable
@updatable
@syncable
export class IndexedDBSource<
    QO extends RequestOptions = RecordSourceQueryOptions,
    TO extends RequestOptions = RequestOptions,
    QB = RecordQueryBuilder,
    TB = RecordTransformBuilder,
    QRD = unknown,
    TRD extends RecordCacheUpdateDetails = RecordCacheUpdateDetails
  >
  extends RecordSource<QO, TO, QB, TB>
  implements
    RecordSyncable,
    RecordQueryable<QRD, QB, QO>,
    RecordUpdatable<TRD, TB, TO> {
  protected _cache: IndexedDBCache<QO, TO, QB, TB, QRD, TRD>;

  constructor(settings: IndexedDBSourceSettings<QO, TO, QB, TB, QRD, TRD>) {
    assert(
      "IndexedDBSource's `schema` must be specified in `settings.schema` constructor argument",
      !!settings.schema
    );
    assert('Your browser does not support IndexedDB!', supportsIndexedDB());

    settings.name = settings.name ?? 'indexedDB';
    const autoActivate = settings.autoActivate !== false;
    settings.autoActivate = false;

    super(settings);

    const cacheSettings: Partial<IndexedDBCacheSettings<QO, TO, QB, TB>> =
      settings.cacheSettings ?? {};
    cacheSettings.schema = settings.schema;
    cacheSettings.keyMap = settings.keyMap;
    cacheSettings.queryBuilder ??= this.queryBuilder;
    cacheSettings.transformBuilder ??= this.transformBuilder;
    cacheSettings.defaultQueryOptions ??= settings.defaultQueryOptions;
    cacheSettings.defaultTransformOptions ??= settings.defaultTransformOptions;
    cacheSettings.namespace ??= settings.namespace;
    cacheSettings.autoValidate ??= settings.autoValidate;

    if (
      cacheSettings.autoValidate !== false &&
      cacheSettings.validatorFor === undefined &&
      cacheSettings.validators === undefined
    ) {
      cacheSettings.validatorFor = this._validatorFor;
    }

    const cacheClass = settings.cacheClass ?? IndexedDBCache;
    this._cache = new cacheClass(
      cacheSettings as IndexedDBCacheSettings<QO, TO, QB, TB>
    );

    if (autoActivate) {
      this.activate();
    }
  }

  get cache(): IndexedDBCache<QO, TO, QB, TB, QRD, TRD> {
    return this._cache;
  }

  get defaultQueryOptions(): DefaultRequestOptions<QO> | undefined {
    return super.defaultQueryOptions;
  }

  set defaultQueryOptions(options: DefaultRequestOptions<QO> | undefined) {
    super.defaultQueryOptions = this.cache.defaultQueryOptions = options;
  }

  get defaultTransformOptions(): DefaultRequestOptions<TO> | undefined {
    return super.defaultTransformOptions;
  }

  set defaultTransformOptions(options: DefaultRequestOptions<TO> | undefined) {
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
    hints?: ResponseHints<RecordTransformResult, TRD>
  ): Promise<FullResponse<RecordTransformResult, TRD, RecordOperation>> {
    let results: RecordTransformResult;
    const response: FullResponse<
      RecordTransformResult,
      TRD,
      RecordOperation
    > = {};

    if (!this.transformLog.contains(transform.id)) {
      results = await this._applyTransform(transform);
      response.transforms = [transform];
    }

    if (hints?.data) {
      if (Array.isArray(transform.operations)) {
        assert(
          'IndexedDBSource#update: `hints.data` must be an array if `transform.operations` is an array',
          Array.isArray(hints.data)
        );

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
      response.data = results;
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
    hints?: ResponseHints<RecordQueryResult, QRD>
  ): Promise<FullResponse<RecordQueryResult, QRD, RecordOperation>> {
    let response: FullResponse<RecordQueryResult, QRD, RecordOperation>;

    if (hints?.data) {
      response = {};
      if (Array.isArray(query.expressions)) {
        assert(
          'IndexedDBSource#query: `hints.data` must be an array if `query.expressions` is an array',
          Array.isArray(hints.data)
        );

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
      response = await this._cache.query(query, {
        fullResponse: true
      } as FullRequestOptions<QO>);
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
  ): Promise<FullResponse<undefined, TRD, RecordOperation>> {
    const fullResponse: FullResponse<undefined, TRD, RecordOperation> = {};

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
  ): Promise<FullResponse<undefined, QRD, RecordOperation>> {
    const fullResponse: FullResponse<undefined, QRD, RecordOperation> = {};
    let operations: RecordOperation[];

    const results = await this._cache.query(query);

    if (Array.isArray(query.expressions)) {
      operations = [];
      for (let result of results as RecordQueryExpressionResult[]) {
        operations.push(...this._operationsFromQueryResult(result));
      }
    } else {
      operations = this._operationsFromQueryResult(
        results as RecordQueryExpressionResult
      );
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
