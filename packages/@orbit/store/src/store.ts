import Orbit, {
  KeyMap,
  RecordOperation,
  Schema,
  Source, SourceOptions,
  Syncable, syncable,
  Query, QueryOrExpression,
  Queryable, queryable,
  Updatable, updatable,
  Transform,
  TransformLog,
  TransformOrOperations,
  coalesceRecordOperations
} from '@orbit/core';
import { assert, Dict } from '@orbit/utils';
import Cache, { CacheOptions } from './cache';

export interface StoreOptions extends SourceOptions {
  cacheOptions?: CacheOptions
}

export interface StoreMergeOptions {
  coalesce?: boolean;
  sinceTransformId?: string;
}

@syncable
@queryable
@updatable
export default class Store extends Source implements Syncable, Queryable, Updatable {
  private _cache: Cache;
  private _transforms: Dict<Transform>;
  private _transformInverses: Dict<RecordOperation[]>;

  // Syncable interface stubs
  sync: (transformOrTransforms: Transform | Transform[]) => Promise<void>;

  // Queryable interface stubs
  query: (query: Query) => Promise<any>;

  // Updatable interface stubs
  update: (transformOrOperations: TransformOrOperations) => Promise<void>;

  constructor(options: StoreOptions = {}) {
    let keyMap: KeyMap = options.keyMap;
    assert('Store\'s `keyMap` must be specified in `options.keyMap` constructor argument', !!keyMap);

    options.name = options.name || 'store';

    let schema: Schema = options.schema;
    assert('Store requires a schema', !!schema);

    super(options);

    this._transforms = {};
    this._transformInverses = {};

    this.transformLog.on('clear', <() => void>this._logCleared, this);
    this.transformLog.on('truncate', <() => void>this._logTruncated, this);
    this.transformLog.on('rollback', <() => void>this._logRolledback, this);

    let cacheOptions: CacheOptions = options.cacheOptions || {};
    cacheOptions.schema = schema;
    cacheOptions.keyMap = keyMap;
    this._cache = new Cache(cacheOptions);
  }

  get cache(): Cache {
    return this._cache;
  }

  /////////////////////////////////////////////////////////////////////////////
  // Syncable interface implementation
  /////////////////////////////////////////////////////////////////////////////

  _sync(transform: Transform) {
    this._applyTransform(transform);
    return Orbit.Promise.resolve();
  }

  /////////////////////////////////////////////////////////////////////////////
  // Updatable interface implementation
  /////////////////////////////////////////////////////////////////////////////

  _update(transform: Transform) {
    this._applyTransform(transform);
    return Orbit.Promise.resolve();
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
   @param {String} [name] - The name of the forked store.
   @returns {Store} The forked store.
  */
  fork(options: StoreOptions = {}) {
    options.schema = this._schema;
    options.cacheOptions = options.cacheOptions || {};
    options.cacheOptions.base = this._cache;
    options.keyMap = this._keyMap;

    return new Store(options);
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
   @param {Object}  [options] Options
   @param {Boolean} [options.coalesce = true] Should operations be coalesced into a minimal equivalent set?
   @param {String}  [options.sinceTransformId = null] Select only transforms since the specified ID.
   @returns {Promise} The result of calling `update()` with the forked transforms.
  */
  merge(forkedStore: Store, options: StoreMergeOptions = {}) {
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

    reducedTransform = new Transform(ops);

    return this.update(reducedTransform);
  }

  /**
   Rolls back the Store to a particular transformId

   @method rollback
   @param {string} transformId - The ID of the transform to roll back to
   @param {number} relativePosition - A positive or negative integer to specify a position relative to `transformId`
   @returns {undefined}
  */
  rollback(transformId: string, relativePosition: number = 0) {
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

  /////////////////////////////////////////////////////////////////////////////
  // Protected methods
  /////////////////////////////////////////////////////////////////////////////

  protected _applyTransform(transform: Transform): void {
    const inverse = this.cache.patch(<RecordOperation[]>transform.operations);
    this._transforms[transform.id] = transform;
    this._transformInverses[transform.id] = inverse;
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
