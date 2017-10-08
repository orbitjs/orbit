import Orbit, {
  KeyMap,
  RecordOperation,
  Schema,
  Source, SourceSettings,
  Syncable, syncable,
  Query, QueryOrExpression,
  Queryable, queryable,
  Updatable, updatable,
  Transform,
  TransformOrOperations,
  coalesceRecordOperations,
  buildTransform
} from '@orbit/data';
import { Log } from '@orbit/core';
import { assert, Dict } from '@orbit/utils';
import Cache, { CacheSettings, PatchResultData } from './cache';

export interface StoreSettings extends SourceSettings {
  base?: Store;
  cacheSettings?: CacheSettings;
}

export interface StoreMergeOptions {
  coalesce?: boolean;
  sinceTransformId?: string;
  transformOptions?: object;
}

@syncable
@queryable
@updatable
export default class Store extends Source implements Syncable, Queryable, Updatable {
  private _cache: Cache;
  private _base: Store;
  private _forkPoint: string;
  private _transforms: Dict<Transform>;
  private _transformInverses: Dict<RecordOperation[]>;

  // Syncable interface stubs
  sync: (transformOrTransforms: Transform | Transform[]) => Promise<void>;

  // Queryable interface stubs
  query: (queryOrExpression: QueryOrExpression, options?: object, id?: string) => Promise<any>;

  // Updatable interface stubs
  update: (transformOrOperations: TransformOrOperations, options?: object, id?: string) => Promise<any>;

  constructor(settings: StoreSettings = {}) {
    assert('Store\'s `schema` must be specified in `settings.schema` constructor argument', !!settings.schema);

    let keyMap: KeyMap = settings.keyMap;
    let schema: Schema = settings.schema;

    settings.name = settings.name || 'store';

    super(settings);

    this._transforms = {};
    this._transformInverses = {};

    this.transformLog.on('clear', <() => void>this._logCleared, this);
    this.transformLog.on('truncate', <() => void>this._logTruncated, this);
    this.transformLog.on('rollback', <() => void>this._logRolledback, this);

    let cacheSettings: CacheSettings = settings.cacheSettings || {};
    cacheSettings.schema = schema;
    cacheSettings.keyMap = keyMap;
    cacheSettings.queryBuilder = cacheSettings.queryBuilder || this.queryBuilder;
    cacheSettings.transformBuilder = cacheSettings.transformBuilder || this.transformBuilder;
    if (settings.base) {
      this._base = settings.base;
      this._forkPoint = this._base.transformLog.head;
      cacheSettings.base = this._base.cache;
    }
    this._cache = new Cache(cacheSettings);
  }

  get cache(): Cache {
    return this._cache;
  }

  get base(): Store {
    return this._base;
  }

  get forkPoint(): string {
    return this._forkPoint;
  }

  /////////////////////////////////////////////////////////////////////////////
  // Syncable interface implementation
  /////////////////////////////////////////////////////////////////////////////

  _sync(transform: Transform): Promise<void> {
    this._applyTransform(transform);
    return Orbit.Promise.resolve();
  }

  /////////////////////////////////////////////////////////////////////////////
  // Updatable interface implementation
  /////////////////////////////////////////////////////////////////////////////

  _update(transform: Transform): Promise<any> {
    let results = this._applyTransform(transform);
    return Orbit.Promise.resolve(results.length === 1 ? results[0] : results);
  }

  /////////////////////////////////////////////////////////////////////////////
  // Queryable interface implementation
  /////////////////////////////////////////////////////////////////////////////

  _query(query: QueryOrExpression) {
    return Orbit.Promise.resolve(this._cache.query(query));
  }

  /////////////////////////////////////////////////////////////////////////////
  // Public methods
  /////////////////////////////////////////////////////////////////////////////

  /**
   Create a clone, or "fork", from a "base" store.

   The forked store will have the same `schema` and `keyMap` as its base store.
   The forked store's cache will start with the same immutable document as
   the base store. Its contents and log will evolve independently.

   @method fork
   @returns {Store} The forked store.
  */
  fork(settings: StoreSettings = {}) {
    settings.schema = this._schema;
    settings.cacheSettings = settings.cacheSettings || {};
    settings.keyMap = this._keyMap;
    settings.queryBuilder = this.queryBuilder;
    settings.transformBuilder = this.transformBuilder;
    settings.base = this;

    return new Store(settings);
  }

  /**
   Merge transforms from a forked store back into a base store.

   By default, all of the operations from all of the transforms in the forked
   store's history will be reduced into a single transform. A subset of
   operations can be selected by specifying the `sinceTransformId` option.

   The `coalesce` option controls whether operations are coalesced into a
   minimal equivalent set before being reduced into a transform.

   @method merge
   @param {Store} forkedStore - The store to merge.
   @param {Object}  [options] settings
   @param {Boolean} [options.coalesce = true] Should operations be coalesced into a minimal equivalent set?
   @param {String}  [options.sinceTransformId = null] Select only transforms since the specified ID.
   @returns {Promise} The result of calling `update()` with the forked transforms.
  */
  merge(forkedStore: Store, options: StoreMergeOptions = {}): Promise<any> {
    let transforms: Transform[];
    if (options.sinceTransformId) {
      transforms = forkedStore.transformsSince(options.sinceTransformId);
    } else {
      transforms = forkedStore.allTransforms();
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
   Rolls back the Store to a particular transformId

   @method rollback
   @param {string} transformId - The ID of the transform to roll back to
   @param {number} relativePosition - A positive or negative integer to specify a position relative to `transformId`
   @returns {undefined}
  */
  rollback(transformId: string, relativePosition: number = 0): Promise<void> {
    return this.transformLog.rollback(transformId, relativePosition);
  }

  /**
   Returns all transforms since a particular `transformId`.

   @method transformsSince
   @param {string} transformId - The ID of the transform to start with.
   @returns {Array} Array of transforms.
  */
  transformsSince(transformId: string): Transform[] {
    return this.transformLog
      .after(transformId)
      .map(id => this._transforms[id]);
  }

  /**
   Returns all tracked transforms.

   @method allTransforms
   @returns {Array} Array of transforms.
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
