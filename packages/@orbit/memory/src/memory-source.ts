import { Assertion } from '@orbit/core';
import {
  coalesceRecordOperations,
  RecordOperation,
  RecordOperationResult,
  RecordQueryResult,
  RecordQueryExpressionResult,
  RecordTransformResult,
  RecordSource,
  RecordSourceSettings,
  RecordTransform,
  RecordQuery,
  RecordSyncable,
  RecordUpdatable,
  RecordQueryable,
  RecordSourceQueryOptions,
  RecordQueryBuilder,
  RecordTransformBuilder
} from '@orbit/records';
import {
  syncable,
  RequestOptions,
  queryable,
  updatable,
  buildTransform,
  FullResponse,
  DefaultRequestOptions,
  FullRequestOptions
} from '@orbit/data';
import { ResponseHints } from '@orbit/data';
import { Dict } from '@orbit/utils';
import {
  MemoryCache,
  MemoryCacheClass,
  MemoryCacheSettings
} from './memory-cache';
import { RecordCacheUpdateDetails } from '@orbit/record-cache';

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
  sinceTransformId?: string;
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
    RecordUpdatable<TRD, TB, TO> {
  protected _cache: MemoryCache<QO, TO, QB, TB, QRD, TRD>;
  protected _base?: MemorySource<QO, TO, QB, TB, QRD, TRD>;
  protected _forkPoint?: string;
  protected _transforms: Dict<RecordTransform>;
  protected _transformInverses: Dict<RecordOperation[]>;

  constructor(settings: MemorySourceSettings<QO, TO, QB, TB, QRD, TRD>) {
    const { keyMap, schema } = settings;

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
    cacheSettings.queryBuilder =
      cacheSettings.queryBuilder ?? this.queryBuilder;
    cacheSettings.transformBuilder =
      cacheSettings.transformBuilder ?? this.transformBuilder;
    cacheSettings.defaultQueryOptions =
      cacheSettings.defaultQueryOptions ?? settings.defaultQueryOptions;
    cacheSettings.defaultTransformOptions =
      cacheSettings.defaultTransformOptions ?? settings.defaultTransformOptions;

    if (
      cacheSettings.validatorFor === undefined &&
      cacheSettings.validators === undefined
    ) {
      cacheSettings.validatorFor = this._validatorFor;
    }

    const { base } = settings;
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
    hints?: ResponseHints<RecordQueryResult, QRD>
  ): Promise<FullResponse<RecordQueryResult, QRD, RecordOperation>> {
    let response: FullResponse<RecordQueryResult, QRD, RecordOperation>;

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
    settings: MemorySourceSettings<QO, TO, QB, TB, QRD, TRD> = {
      schema: this.schema
    }
  ): MemorySource<QO, TO, QB, TB, QRD, TRD> {
    const schema = this.schema;

    settings.schema = schema;
    settings.cacheSettings = settings.cacheSettings || { schema };
    settings.keyMap = this._keyMap;
    settings.queryBuilder = this._queryBuilder;
    settings.transformBuilder = this._transformBuilder;
    settings.validatorFor = this._validatorFor;
    settings.base = this;

    return new MemorySource<QO, TO, QB, TB, QRD, TRD>(settings);
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
  merge(
    forkedSource: MemorySource,
    options: MemorySourceMergeOptions = {}
  ): Promise<any> {
    let transforms: RecordTransform[];
    if (options.sinceTransformId) {
      transforms = forkedSource.transformsSince(options.sinceTransformId);
    } else {
      transforms = forkedSource.allTransforms();
    }

    let reducedTransform;
    let ops: RecordOperation[] = [];
    transforms.forEach((t) => {
      Array.prototype.push.apply(ops, t.operations);
    });

    if (options.coalesce !== false) {
      ops = coalesceRecordOperations(ops);
    }

    reducedTransform = buildTransform(ops, options.transformOptions);

    return this.update(reducedTransform);
  }

  /**
   * Rebase works similarly to a git rebase:
   *
   * After a source is forked, there is a parent- and a child-source. Both may be
   * updated with transforms. If, after some updates on both sources
   * `childSource.rebase()` is called, the result on the child source will look
   * like, as if all updates to the parent source were added first, followed by
   * those made in the child source. This means that updates in the child source
   * have a tendency of winning.
   */
  rebase(): void {
    let base = this._base;
    let forkPoint = this._forkPoint;

    if (!base) {
      throw new Assertion(
        'A `base` source must be defined for `rebase` to work'
      );
    }

    let baseTransforms: RecordTransform[];
    if (forkPoint === undefined) {
      // source was empty at fork point
      baseTransforms = base.allTransforms();
    } else {
      baseTransforms = base.transformsSince(forkPoint);
    }

    if (baseTransforms.length > 0) {
      let localTransforms = this.allTransforms();

      localTransforms.reverse().forEach((transform) => {
        const inverseOperations = this._transformInverses[transform.id];
        if (inverseOperations) {
          this.cache.update(inverseOperations);
        }
        this._clearTransformFromHistory(transform.id);
      });

      baseTransforms.forEach((transform) => this._applyTransform(transform));
      localTransforms.forEach((transform) => this._applyTransform(transform));
      this._forkPoint = base.transformLog.head;
    }
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
   * Returns all transforms since a particular `transformId`.
   */
  transformsSince(transformId: string): RecordTransform[] {
    return this.transformLog
      .after(transformId)
      .map((id) => this._transforms[id]);
  }

  /**
   * Returns all tracked transforms.
   */
  allTransforms(): RecordTransform[] {
    return this.transformLog.entries.map((id) => this._transforms[id]);
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
    super.defaultQueryOptions = this.cache.defaultQueryOptions = options;
  }

  get defaultTransformOptions(): DefaultRequestOptions<TO> | undefined {
    return super.defaultTransformOptions;
  }

  set defaultTransformOptions(options: DefaultRequestOptions<TO> | undefined) {
    this._defaultTransformOptions = this.cache.defaultTransformOptions = options;
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
    this._transformInverses[transform.id] = details?.inverseOperations || [];
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
