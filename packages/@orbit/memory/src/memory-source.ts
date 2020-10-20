import { Assertion, Orbit } from '@orbit/core';
import {
  RecordOperation,
  Source,
  SourceSettings,
  Syncable,
  syncable,
  Query,
  QueryOrExpressions,
  RequestOptions,
  Queryable,
  queryable,
  Updatable,
  updatable,
  Transform,
  TransformOrOperations,
  coalesceRecordOperations,
  buildTransform,
  RecordIdentity,
  RecordQueryResult,
  RecordTransformResult,
  RecordOperationResult,
  FullResponse,
  Response,
  RecordQueryExpressionResult
} from '@orbit/data';
import { ResponseHints } from '@orbit/data/dist/modules/response';
import { Dict } from '@orbit/utils';
import { MemoryCache, MemoryCacheSettings } from './memory-cache';

const { assert } = Orbit;

export interface MemorySourceSettings extends SourceSettings {
  base?: MemorySource;
  cacheSettings?: Partial<MemoryCacheSettings>;
}

export interface MemorySourceMergeOptions {
  coalesce?: boolean;
  sinceTransformId?: string;
  transformOptions?: RequestOptions;
}

@syncable
@queryable
@updatable
export class MemorySource
  extends Source
  implements
    Syncable,
    Queryable<RecordQueryResult, undefined>,
    Updatable<RecordTransformResult, undefined> {
  private _cache: MemoryCache;
  private _base?: MemorySource;
  private _forkPoint?: string;
  private _transforms: Dict<Transform>;
  private _transformInverses: Dict<RecordOperation[]>;

  // Syncable interface stubs
  sync!: (transformOrTransforms: Transform | Transform[]) => Promise<void>;

  // Queryable interface stubs
  query!: (
    queryOrExpressions: QueryOrExpressions,
    options?: RequestOptions,
    id?: string
  ) => Promise<Response<RecordQueryResult, undefined>>;

  // Updatable interface stubs
  update!: (
    transformOrOperations: TransformOrOperations,
    options?: RequestOptions,
    id?: string
  ) => Promise<Response<RecordTransformResult, undefined>>;

  constructor(settings: MemorySourceSettings = {}) {
    assert(
      "MemorySource's `schema` must be specified in `settings.schema` constructor argument",
      !!settings.schema
    );

    const { keyMap, schema } = settings;

    settings.name = settings.name || 'memory';

    super(settings);

    this._transforms = {};
    this._transformInverses = {};

    this.transformLog.on('clear', this._logCleared.bind(this));
    this.transformLog.on('truncate', this._logTruncated.bind(this));
    this.transformLog.on('rollback', this._logRolledback.bind(this));

    let cacheSettings: Partial<MemoryCacheSettings> =
      settings.cacheSettings || {};
    cacheSettings.schema = schema;
    cacheSettings.keyMap = keyMap;
    cacheSettings.queryBuilder =
      cacheSettings.queryBuilder || this.queryBuilder;
    cacheSettings.transformBuilder =
      cacheSettings.transformBuilder || this.transformBuilder;
    if (settings.base) {
      this._base = settings.base;
      this._forkPoint = this._base.transformLog.head;
      cacheSettings.base = this._base.cache;
    }
    this._cache = new MemoryCache(cacheSettings as MemoryCacheSettings);
  }

  get cache(): MemoryCache {
    return this._cache;
  }

  get base(): MemorySource | undefined {
    return this._base;
  }

  get forkPoint(): string | undefined {
    return this._forkPoint;
  }

  upgrade(): Promise<void> {
    this._cache.upgrade();
    return Promise.resolve();
  }

  /////////////////////////////////////////////////////////////////////////////
  // Syncable interface implementation
  /////////////////////////////////////////////////////////////////////////////

  async _sync(transform: Transform): Promise<void> {
    if (!this.transformLog.contains(transform.id)) {
      this._applyTransform(transform);
      await this.transformed([transform]);
    }
  }

  /////////////////////////////////////////////////////////////////////////////
  // Updatable interface implementation
  /////////////////////////////////////////////////////////////////////////////

  async _update(
    transform: Transform,
    hints?: ResponseHints<RecordTransformResult>
  ): Promise<FullResponse<RecordTransformResult, undefined>> {
    let results: RecordTransformResult;
    let data: RecordTransformResult;

    if (!this.transformLog.contains(transform.id)) {
      results = this._applyTransform(transform);
      await this.transformed([transform]);
    }

    if (hints?.data) {
      if (transform.operations.length > 1 && Array.isArray(hints.data)) {
        data = hints.data.map((id) => {
          return id ? this._cache.getRecordSync(id) : undefined;
        });
      } else {
        data = this._cache.getRecordSync(hints.data as RecordIdentity);
      }
    } else if (results) {
      if (transform.operations.length === 1 && Array.isArray(results)) {
        data = results[0];
      } else {
        data = results;
      }
    }

    return { data };
  }

  /////////////////////////////////////////////////////////////////////////////
  // Queryable interface implementation
  /////////////////////////////////////////////////////////////////////////////

  async _query(
    query: Query,
    hints?: ResponseHints<RecordQueryResult>
  ): Promise<FullResponse<RecordQueryResult, undefined>> {
    let data: RecordQueryResult;

    if (hints?.data) {
      if (query.expressions.length > 1 && Array.isArray(hints.data)) {
        let hintsData = hints.data as (RecordIdentity | RecordIdentity[])[];
        data = hintsData.map((idOrIds) => this._retrieveFromCache(idOrIds));
      } else {
        let hintsData = hints.data as RecordIdentity | RecordIdentity[];
        data = this._retrieveFromCache(hintsData);
      }
    } else {
      data = this._cache.query(query);
    }

    return { data };
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
  fork(settings: MemorySourceSettings = {}): MemorySource {
    const schema = this._schema;

    settings.schema = schema;
    settings.cacheSettings = settings.cacheSettings || { schema };
    settings.keyMap = this._keyMap;
    settings.queryBuilder = this.queryBuilder;
    settings.transformBuilder = this.transformBuilder;
    settings.base = this;

    return new MemorySource(settings);
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
    let transforms: Transform[];
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

    let baseTransforms: Transform[];
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
          this.cache.patch(inverseOperations);
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
  transformsSince(transformId: string): Transform[] {
    return this.transformLog
      .after(transformId)
      .map((id) => this._transforms[id]);
  }

  /**
   * Returns all tracked transforms.
   */
  allTransforms(): Transform[] {
    return this.transformLog.entries.map((id) => this._transforms[id]);
  }

  getTransform(transformId: string): Transform {
    return this._transforms[transformId];
  }

  getInverseOperations(transformId: string): RecordOperation[] {
    return this._transformInverses[transformId];
  }

  /////////////////////////////////////////////////////////////////////////////
  // Protected methods
  /////////////////////////////////////////////////////////////////////////////

  protected _retrieveFromCache(
    idOrIds: RecordIdentity[] | RecordIdentity | null
  ): RecordQueryExpressionResult {
    if (Array.isArray(idOrIds)) {
      return this._cache.getRecordsSync(idOrIds);
    } else if (idOrIds) {
      return this._cache.getRecordSync(idOrIds);
    } else {
      return idOrIds;
    }
  }

  protected _applyTransform(transform: Transform): RecordOperationResult[] {
    const result = this.cache.patch(transform.operations as RecordOperation[]);
    this._transforms[transform.id] = transform;
    this._transformInverses[transform.id] = result.inverse;
    return result.data;
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
        this.cache.patch(inverseOperations);
      }
      this._clearTransformFromHistory(id);
    });
  }
}
