import { Assertion, Orbit } from '@orbit/core';
import {
  DefaultRequestOptions,
  FullRequestOptions,
  FullResponse,
  queryable,
  RequestOptions,
  Resettable,
  ResponseHints,
  syncable,
  updatable
} from '@orbit/data';
import { RecordCacheUpdateDetails } from '@orbit/record-cache';
import {
  coalesceRecordOperations,
  RecordOperation,
  RecordOperationResult,
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
  RecordUpdatable
} from '@orbit/records';
import { Dict, toArray } from '@orbit/utils';
import {
  MemoryCache,
  MemoryCacheClass,
  MemoryCacheSettings
} from './memory-cache';

const { assert, deprecate } = Orbit;

export interface MemorySourceSettings<
  QO extends RequestOptions = RecordSourceQueryOptions,
  TO extends RequestOptions = RequestOptions,
  QB = RecordQueryBuilder,
  TB = RecordTransformBuilder,
  QRD = unknown,
  TRD extends RecordCacheUpdateDetails = RecordCacheUpdateDetails
> extends RecordSourceSettings<QO, TO, QB, TB> {
  base?: MemorySource<QO, TO, QB, TB, QRD, TRD>;
  cacheClass?: MemoryCacheClass<QO, TO, QB, TB, QRD, TRD>;
  cacheSettings?: Partial<MemoryCacheSettings<QO, TO, QB, TB, QRD, TRD>>;
}

export interface MemorySourceMergeOptions {
  coalesce?: boolean;

  /**
   * @deprecated since v0.17
   */
  sinceTransformId?: string;

  /**
   * @deprecated since v0.17, include transform options alongside merge options instead
   */
  transformOptions?: RequestOptions;
}

export interface MemorySource<
  QO extends RequestOptions = RecordSourceQueryOptions,
  TO extends RequestOptions = RequestOptions,
  QB = RecordQueryBuilder,
  TB = RecordTransformBuilder,
  QRD = unknown,
  TRD extends RecordCacheUpdateDetails = RecordCacheUpdateDetails
> extends RecordSource<QO, TO, QB, TB>,
    RecordSyncable,
    RecordQueryable<QRD, QB, QO>,
    RecordUpdatable<TRD, TB, TO> {}

@syncable
@queryable
@updatable
export class MemorySource<
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
    RecordUpdatable<TRD, TB, TO>,
    Resettable {
  protected _cache: MemoryCache<QO, TO, QB, TB, QRD, TRD>;
  protected _base?: MemorySource<QO, TO, QB, TB, QRD, TRD>;
  protected _forkPoint?: string;
  protected _transforms: Dict<RecordTransform>;
  protected _transformInverses: Dict<RecordOperation[]>;

  constructor(settings: MemorySourceSettings<QO, TO, QB, TB, QRD, TRD>) {
    const { keyMap, schema, base } = settings;

    settings.name = settings.name ?? 'memory';

    super(settings);

    this._transforms = {};
    this._transformInverses = {};

    this.transformLog.on('clear', this._logCleared.bind(this));
    this.transformLog.on('truncate', this._logTruncated.bind(this));
    this.transformLog.on('rollback', this._logRolledback.bind(this));

    let cacheSettings: Partial<MemoryCacheSettings<QO, TO, QB, TB, QRD, TRD>> =
      settings.cacheSettings ?? {};
    cacheSettings.schema = schema;
    cacheSettings.keyMap = keyMap;
    cacheSettings.queryBuilder ??= this.queryBuilder;
    cacheSettings.transformBuilder ??= this.transformBuilder;
    cacheSettings.defaultQueryOptions ??= this.defaultQueryOptions;
    cacheSettings.defaultTransformOptions ??= this.defaultTransformOptions;
    cacheSettings.autoValidate ??= settings.autoValidate;

    if (
      cacheSettings.autoValidate !== false &&
      cacheSettings.validatorFor === undefined &&
      cacheSettings.validators === undefined
    ) {
      cacheSettings.validatorFor = this._validatorFor;
    }

    if (base) {
      this._base = base;
      this._forkPoint = base.transformLog.head;
      cacheSettings.base = base.cache;
    }

    const cacheClass = settings.cacheClass ?? MemoryCache;
    this._cache = new cacheClass(
      cacheSettings as MemoryCacheSettings<QO, TO, QB, TB, QRD, TRD>
    );
  }

  get cache(): MemoryCache<QO, TO, QB, TB, QRD, TRD> {
    return this._cache;
  }

  get base(): MemorySource<QO, TO, QB, TB, QRD, TRD> | undefined {
    return this._base;
  }

  get forkPoint(): string | undefined {
    return this._forkPoint;
  }

  async upgrade(): Promise<void> {
    this._cache.upgrade();
  }

  /////////////////////////////////////////////////////////////////////////////
  // Syncable interface implementation
  /////////////////////////////////////////////////////////////////////////////

  async _sync(transform: RecordTransform): Promise<void> {
    if (!this.transformLog.contains(transform.id)) {
      this._applyTransform(transform);
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
          'MemorySource#update: `hints.data` must be an array if `transform.operations` is an array',
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
          'MemorySource#query: `hints.data` must be an array if `query.expressions` is an array',
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
  // Public methods
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Create a clone, or "fork", from a "base" source.
   *
   * The forked source will have the same `schema` and `keyMap` as its base source.
   * The forked source's cache will start with the same immutable document as
   * the base source. Its contents and log will evolve independently.
   *
   * @returns The forked source.
   */
  fork(
    settings: Partial<MemorySourceSettings<QO, TO, QB, TB, QRD, TRD>> = {}
  ): MemorySource<QO, TO, QB, TB, QRD, TRD> {
    // required settings
    settings.base = this;
    settings.schema = this.schema;
    settings.keyMap = this.keyMap;

    // customizable settings
    settings.queryBuilder ??= this._queryBuilder;
    settings.transformBuilder ??= this._transformBuilder;
    settings.defaultQueryOptions ??= this._defaultQueryOptions;
    settings.defaultTransformOptions ??= this._defaultTransformOptions;
    if (settings.autoValidate !== false) {
      settings.validatorFor ??= this._validatorFor;
      if (
        settings.autoValidate === undefined &&
        settings.validatorFor === undefined
      ) {
        settings.autoValidate = false;
      }
    }

    return new MemorySource<QO, TO, QB, TB, QRD, TRD>(
      settings as MemorySourceSettings<QO, TO, QB, TB, QRD, TRD>
    );
  }

  /**
   * Merge transforms from a forked source back into a base source.
   *
   * By default, all of the operations from all of the transforms in the forked
   * source's history will be reduced into a single transform. A subset of
   * operations can be selected by specifying the `sinceTransformId` option.
   *
   * The `coalesce` option controls whether operations are coalesced into a
   * minimal equivalent set before being reduced into a transform.
   *
   * @param forkedSource - The source to merge.
   * @param options - Merge options
   * @returns The result of calling `update()` with the forked transforms.
   */
  merge<RequestData extends RecordTransformResult = RecordTransformResult>(
    forkedSource: MemorySource<QO, TO, QB, TB, QRD, TRD>,
    options?: DefaultRequestOptions<TO> & MemorySourceMergeOptions
  ): Promise<RequestData>;
  merge<RequestData extends RecordTransformResult = RecordTransformResult>(
    forkedSource: MemorySource<QO, TO, QB, TB, QRD, TRD>,
    options: FullRequestOptions<TO> & MemorySourceMergeOptions
  ): Promise<FullResponse<RequestData, TRD, RecordOperation>>;
  async merge<
    RequestData extends RecordTransformResult = RecordTransformResult
  >(
    forkedSource: MemorySource<QO, TO, QB, TB, QRD, TRD>,
    options?: TO & MemorySourceMergeOptions
  ): Promise<
    RecordTransformResult | FullResponse<RequestData, TRD, RecordOperation>
  > {
    let { coalesce, sinceTransformId, transformOptions, ...remainingOptions } =
      options ?? {};

    let requestOptions: TO;
    if (transformOptions) {
      deprecate(
        'In MemorySource#merge, passing `transformOptions` nested within `options` is deprecated. Instead, include them directly alongside other options.'
      );
      requestOptions = transformOptions as TO;
    } else {
      requestOptions = (remainingOptions ?? {}) as TO;
    }

    let ops: RecordOperation[] = [];

    if (forkedSource.cache.isTrackingUpdateOperations) {
      ops = forkedSource.cache.getAllUpdateOperations();
    } else {
      let transforms: RecordTransform[];
      if (sinceTransformId) {
        deprecate(
          'In MemorySource#merge, passing `sinceTransformId` is deprecated. Instead, call `update` with a custom transform/operations.'
        );
        transforms = forkedSource.getTransformsSince(sinceTransformId);
      } else {
        transforms = forkedSource.getAllTransforms();
      }

      transforms.forEach((t) => {
        Array.prototype.push.apply(ops, toArray(t.operations));
      });
    }

    if (coalesce !== false) {
      ops = coalesceRecordOperations(ops);
    }

    if (requestOptions.fullResponse) {
      return this.update<RequestData>(
        ops,
        requestOptions as FullRequestOptions<TO>
      );
    } else {
      return this.update<RequestData>(
        ops,
        requestOptions as DefaultRequestOptions<TO>
      );
    }
  }

  /**
   * Rebase works similarly to a git rebase:
   *
   * After a source is forked, there is a parent- and a child-source. Both may
   * be updated with transforms. When `childSource.rebase()` is called, the
   * child source's state will be reset to match the current state of its
   * parent, and then any locally made transforms will be replayed on the child
   * source.
   */
  rebase(): void {
    const base = this._base;

    if (!base) {
      throw new Assertion(
        'A `base` source must be defined for `rebase` to work'
      );
    }

    // reset the state of the cache to match the base cache
    this.cache.reset();

    // replay all locally made transforms
    this.getAllTransforms().forEach((t) => this._applyTransform(t));

    // reset the fork point
    this._forkPoint = base.transformLog.head;
  }

  /**
   * Reset the source's cache and transform log to its initial state, which will
   * be either empty or a matching its `base`, if it has one.
   */
  async reset(): Promise<void> {
    // reset the state of the cache (which will match a base cache, if present)
    this.cache.reset();

    // reset the fork point
    this._forkPoint = this._base ? this._base.transformLog.head : undefined;

    // clear the transform log, which in turn will clear any tracked transforms
    await this.transformLog.clear();
  }

  /**
   * Rolls back the source to a particular `transformId`.
   *
   * `relativePosition` can be a positive or negative integer used to specify a
   * position relative to `transformId`.
   */
  rollback(transformId: string, relativePosition = 0): Promise<void> {
    return this.transformLog.rollback(transformId, relativePosition);
  }

  /**
   * Returns all logged transforms since a particular `transformId`.
   */
  getTransformsSince(transformId: string): RecordTransform[] {
    return this.transformLog
      .after(transformId)
      .map((id) => this._transforms[id]);
  }

  /**
   * @deprecated since v0.17, call `getTransformsSince` instead
   */
  transformsSince(transformId: string): RecordTransform[] {
    deprecate(
      'MemorySource#transformsSince has been deprecated. Please call `source.getTransformsSince(tranformId)` instead.'
    );
    return this.getTransformsSince(transformId);
  }

  /**
   * Returns all logged transforms.
   */
  getAllTransforms(): RecordTransform[] {
    return this.transformLog.entries.map((id) => this._transforms[id]);
  }

  /**
   * @deprecated since v0.17, call `getAllTransforms` instead
   */
  allTransforms(): RecordTransform[] {
    deprecate(
      'MemorySource#allTransforms has been deprecated. Please call `source.getAllTransforms()` instead.'
    );
    return this.getAllTransforms();
  }

  getTransform(transformId: string): RecordTransform {
    return this._transforms[transformId];
  }

  getInverseOperations(transformId: string): RecordOperation[] {
    return this._transformInverses[transformId];
  }

  get defaultQueryOptions(): DefaultRequestOptions<QO> | undefined {
    return super.defaultQueryOptions;
  }

  set defaultQueryOptions(options: DefaultRequestOptions<QO> | undefined) {
    super.defaultQueryOptions = this._cache.defaultQueryOptions = options;
  }

  get defaultTransformOptions(): DefaultRequestOptions<TO> | undefined {
    return super.defaultTransformOptions;
  }

  set defaultTransformOptions(options: DefaultRequestOptions<TO> | undefined) {
    this._defaultTransformOptions = this._cache.defaultTransformOptions = options;
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
    const { data, details } = this.cache.update(transform, {
      fullResponse: true
    } as FullRequestOptions<TO>);
    this._transforms[transform.id] = transform;
    this._transformInverses[transform.id] = details?.inverseOperations ?? [];
    return data;
  }

  protected _clearTransformFromHistory(transformId: string): void {
    delete this._transforms[transformId];
    delete this._transformInverses[transformId];
  }

  protected _logCleared(): void {
    this._transforms = {};
    this._transformInverses = {};
  }

  protected _logTruncated(
    transformId: string,
    relativePosition: number,
    removed: string[]
  ): void {
    removed.forEach((id) => this._clearTransformFromHistory(id));
  }

  protected _logRolledback(
    transformId: string,
    relativePosition: number,
    removed: string[]
  ): void {
    removed.reverse().forEach((id) => {
      const inverseOperations = this._transformInverses[id];
      if (inverseOperations) {
        this.cache.update(inverseOperations);
      }
      this._clearTransformFromHistory(id);
    });
  }
}
