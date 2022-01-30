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
  ResponseHints,
  FullRequestOptions
} from '@orbit/data';
import { RecordCacheUpdateDetails } from '@orbit/record-cache';
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
  RecordOperationResult,
  RecordQueryBuilder,
  RecordTransformBuilder
} from '@orbit/records';
import { supportsLocalStorage } from './lib/local-storage';
import {
  LocalStorageCache,
  LocalStorageCacheClass,
  LocalStorageCacheSettings
} from './local-storage-cache';

const { assert } = Orbit;

export interface LocalStorageSourceSettings<
  QO extends RequestOptions = RecordSourceQueryOptions,
  TO extends RequestOptions = RequestOptions,
  QB = RecordQueryBuilder,
  TB = RecordTransformBuilder,
  QRD = unknown,
  TRD extends RecordCacheUpdateDetails = RecordCacheUpdateDetails
> extends RecordSourceSettings<QO, TO, QB, TB> {
  delimiter?: string;
  namespace?: string;
  cacheClass?: LocalStorageCacheClass<QO, TO, QB, TB, QRD, TRD>;
  cacheSettings?: Partial<LocalStorageCacheSettings<QO, TO, QB, TB>>;
}

export interface LocalStorageSource<
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
 * Source for storing data in localStorage.
 */
@pullable
@pushable
@queryable
@updatable
@syncable
export class LocalStorageSource<
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
  protected _cache: LocalStorageCache<QO, TO, QB, TB, QRD, TRD>;

  constructor(settings: LocalStorageSourceSettings<QO, TO, QB, TB, QRD, TRD>) {
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

    let cacheSettings: Partial<LocalStorageCacheSettings<QO, TO, QB, TB>> =
      settings.cacheSettings ?? {};
    cacheSettings.schema = settings.schema;
    cacheSettings.keyMap = settings.keyMap;
    cacheSettings.queryBuilder ??= this.queryBuilder;
    cacheSettings.transformBuilder ??= this.transformBuilder;
    cacheSettings.defaultQueryOptions ??= settings.defaultQueryOptions;
    cacheSettings.defaultTransformOptions ??= settings.defaultTransformOptions;
    cacheSettings.namespace ??= settings.namespace;
    cacheSettings.delimiter ??= settings.delimiter;
    cacheSettings.autoValidate ??= settings.autoValidate;

    if (
      cacheSettings.autoValidate !== false &&
      cacheSettings.validatorFor === undefined &&
      cacheSettings.validators === undefined
    ) {
      cacheSettings.validatorFor = this._validatorFor;
    }

    const cacheClass = settings.cacheClass ?? LocalStorageCache;
    this._cache = new cacheClass(
      cacheSettings as LocalStorageCacheSettings<QO, TO, QB, TB>
    );
  }

  get cache(): LocalStorageCache<QO, TO, QB, TB, QRD, TRD> {
    return this._cache;
  }

  get namespace(): string {
    return this._cache.namespace;
  }

  get delimiter(): string {
    return this._cache.delimiter;
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
    hints?: ResponseHints<RecordTransformResult, TRD>
  ): Promise<FullResponse<RecordTransformResult, TRD, RecordOperation>> {
    let results: RecordTransformResult;
    const response: FullResponse<
      RecordTransformResult,
      TRD,
      RecordOperation
    > = {};

    if (!this.transformLog.contains(transform.id)) {
      results = this._applyTransform(transform);
      response.transforms = [transform];
    }

    if (hints?.data) {
      if (Array.isArray(transform.operations)) {
        assert(
          'LocalStorageSource#update: `hints.data` must be an array if `transform.operations` is an array',
          Array.isArray(hints.data)
        );

        response.data = (hints.data as RecordOperationResult[]).map((h) =>
          this._retrieveOperationResult(h)
        );
      } else {
        response.data = this._retrieveOperationResult(
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
          'LocalStorageSource#query: `hints.data` must be an array if `query.expressions` is an array',
          Array.isArray(hints.data)
        );

        response.data = (hints.data as RecordQueryExpressionResult[]).map((h) =>
          this._retrieveQueryExpressionResult(h)
        );
      } else {
        response.data = this._retrieveQueryExpressionResult(
          hints.data as RecordQueryExpressionResult
        );
      }
    } else {
      response = this._cache.query(query, {
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
  ): Promise<FullResponse<undefined, QRD, RecordOperation>> {
    const fullResponse: FullResponse<undefined, QRD, RecordOperation> = {};
    let operations: RecordOperation[];

    const results = this._cache.query(query);

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
