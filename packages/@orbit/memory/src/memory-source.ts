import Orbit, {
  KeyMap,
  RecordOperation,
  Schema,
  Source, SourceSettings,
  Syncable, syncable,
  Query,
  QueryOrExpression,
  Queryable, queryable,
  Updatable, updatable,
  Transform,
  TransformOrOperations,
  coalesceRecordOperations,
  buildTransform
} from '@orbit/data';
import { Dict } from '@orbit/utils';
import MemoryCache, { MemoryCacheSettings } from './memory-cache';
import { PatchResultData } from '@orbit/record-cache';

const { assert } = Orbit;

export interface MemorySourceSettings extends SourceSettings {
  base?: MemorySource;
  cacheSettings?: MemoryCacheSettings;
}

export interface MemorySourceMergeOptions {
  coalesce?: boolean;
  sinceTransformId?: string;
  transformOptions?: object;
}

@syncable
@queryable
@updatable
export default class MemorySource extends Source implements Syncable, Queryable, Updatable {
  private _cache: MemoryCache;
  private _base: MemorySource;
  private _forkPoint: string;
  private _transforms: Dict<Transform>;
  private _transformInverses: Dict<RecordOperation[]>;

  // Syncable interface stubs
  sync: (transformOrTransforms: Transform | Transform[]) => Promise<void>;

  // Queryable interface stubs
  query: (queryOrExpression: QueryOrExpression, options?: object, id?: string) => Promise<any>;

  // Updatable interface stubs
  update: (transformOrOperations: TransformOrOperations, options?: object, id?: string) => Promise<any>;

  constructor(settings: MemorySourceSettings = {}) {
    assert('MemorySource\'s `schema` must be specified in `settings.schema` constructor argument', !!settings.schema);

    let keyMap: KeyMap = settings.keyMap;
    let schema: Schema = settings.schema;

    settings.name = settings.name || 'memory';

    super(settings);

    this._transforms = {};
    this._transformInverses = {};

    this.transformLog.on('clear', this._logCleared.bind(this));
    this.transformLog.on('truncate', this._logTruncated.bind(this));
    this.transformLog.on('rollback', this._logRolledback.bind(this));

    let cacheSettings: MemoryCacheSettings = settings.cacheSettings || {};
    cacheSettings.schema = schema;
    cacheSettings.keyMap = keyMap;
    cacheSettings.queryBuilder = cacheSettings.queryBuilder || this.queryBuilder;
    cacheSettings.transformBuilder = cacheSettings.transformBuilder || this.transformBuilder;
    if (settings.base) {
      this._base = settings.base;
      this._forkPoint = this._base.transformLog.head;
      cacheSettings.base = this._base.cache;
    }
    this._cache = new MemoryCache(cacheSettings);
  }

  get cache(): MemoryCache {
    return this._cache;
  }

  get base(): MemorySource {
    return this._base;
  }

  get forkPoint(): string {
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
    this._applyTransform(transform);
  }

  /////////////////////////////////////////////////////////////////////////////
  // Updatable interface implementation
  /////////////////////////////////////////////////////////////////////////////

  async _update(transform: Transform): Promise<any> {
    let results = this._applyTransform(transform);
    return results.length === 1 ? results[0] : results;
  }

  /////////////////////////////////////////////////////////////////////////////
  // Queryable interface implementation
  /////////////////////////////////////////////////////////////////////////////

  async _query(query: Query, hints?: any): Promise<any> {
    if (hints && hints.data) {
      if (Array.isArray(hints.data)) {
        return this._cache.query(q => q.findRecords(hints.data));
      } else if (hints.data) {
        return this._cache.query(q => q.findRecord(hints.data));
      }
    }
    return this._cache.query(query);
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
    settings.schema = this._schema;
    settings.cacheSettings = settings.cacheSettings || {};
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
  merge(forkedSource: MemorySource, options: MemorySourceMergeOptions = {}): Promise<any> {
    let transforms: Transform[];
    if (options.sinceTransformId) {
      transforms = forkedSource.transformsSince(options.sinceTransformId);
    } else {
      transforms = forkedSource.allTransforms();
    }

    let reducedTransform;
    let ops: RecordOperation[] = [];
    transforms.forEach(t => {
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

    assert('A `base` source must be defined for `rebase` to work', !!base);

    let baseTransforms: Transform[];
    if (forkPoint === undefined){
      // source was empty at fork point
      baseTransforms = base.allTransforms();
    } else {
      baseTransforms = base.transformsSince(forkPoint);
    }

    if (baseTransforms.length > 0) {
      let localTransforms = this.allTransforms();

      localTransforms.reverse().forEach(transform => {
        const inverseOperations = this._transformInverses[transform.id];
        if (inverseOperations) {
          this.cache.patch(inverseOperations);
        }
        this._clearTransformFromHistory(transform.id);
      });

      baseTransforms.forEach(transform => this._applyTransform(transform));
      localTransforms.forEach(transform => this._applyTransform(transform));
      this._forkPoint = base.transformLog.head;
    }
  }

  /**
   * Rolls back the source to a particular transformId
   *
   * @param transformId - The ID of the transform to roll back to
   * @param relativePosition - A positive or negative integer to specify a position relative to `transformId`
   */
  rollback(transformId: string, relativePosition: number = 0): Promise<void> {
    return this.transformLog.rollback(transformId, relativePosition);
  }

  /**
   * Returns all transforms since a particular `transformId`.
   *
   * @param transformId - The ID of the transform to start with.
   */
  transformsSince(transformId: string): Transform[] {
    return this.transformLog
      .after(transformId)
      .map(id => this._transforms[id]);
  }

  /**
   * Returns all tracked transforms.
   */
  allTransforms(): Transform[] {
    return this.transformLog.entries
      .map(id => this._transforms[id]);
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

  protected _applyTransform(transform: Transform): PatchResultData[] {
    const result = this.cache.patch(<RecordOperation[]>transform.operations);
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

  protected _logTruncated(transformId: string, relativePosition: number, removed: string[]): void {
    removed.forEach(id => this._clearTransformFromHistory(id));
  }

  protected _logRolledback(transformId: string, relativePosition: number, removed: string[]): void {
    removed.reverse().forEach(id => {
      const inverseOperations = this._transformInverses[id];
      if (inverseOperations) {
        this.cache.patch(inverseOperations);
      }
      this._clearTransformFromHistory(id);
    });
  }
}
