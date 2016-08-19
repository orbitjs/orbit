import Orbit from 'orbit';
import { assert } from 'orbit/lib/assert';
import { extend as assign } from 'orbit/lib/objects';
import Syncable from 'orbit/interfaces/syncable';
import Queryable from 'orbit/interfaces/queryable';
import Updatable from 'orbit/interfaces/updatable';
import TransformLog from 'orbit/transform/log';
import {
  coalesceTransforms,
  reduceTransforms
} from 'orbit-common/lib/transforms';
import Source from 'orbit-common/source';
import Cache from './cache';

export default class Store extends Source {
  constructor({ schema, keyMap, cacheOptions, name } = {}) {
    super(...arguments);

    assert('Store\'s `keyMap` must be specified in `options.keyMap` constructor argument', keyMap);

    this.keyMap = keyMap;
    this.name = name || 'store';

    this._transforms = {};
    this._transformInverses = {};

    this.transformLog.on('clear', this._logCleared, this);
    this.transformLog.on('truncate', this._logTruncated, this);

    this.cache = new Cache(assign({ schema, keyMap }, cacheOptions));
  }

  /////////////////////////////////////////////////////////////////////////////
  // Syncable interface implementation
  /////////////////////////////////////////////////////////////////////////////

  _sync(transform) {
    this._applyTransform(transform);
    return Orbit.Promise.resolve();
  }

  /////////////////////////////////////////////////////////////////////////////
  // Updatable interface implementation
  /////////////////////////////////////////////////////////////////////////////

  _update(transform) {
    this._applyTransform(transform);
    return Orbit.Promise.resolve();
  }

  /////////////////////////////////////////////////////////////////////////////
  // Queryable interface implementation
  /////////////////////////////////////////////////////////////////////////////

  _query(query) {
    return Orbit.Promise.resolve(this.cache.query(query));
  }

  /////////////////////////////////////////////////////////////////////////////
  // Public methods
  /////////////////////////////////////////////////////////////////////////////

  liveQuery(query) {
    this.query(query);
    return this.cache.liveQuery(query);
  }

  /**
   Create a clone, or "fork", from a "base" store.

   The forked store will have the same `schema` and `keyMap` as its base store.
   The forked store's cache will start with the same immutable document as
   the base store. Its contents and log will evolve independently.

   @method fork
   @param {Object} [options] - Options to pass to the forked store's constructor.
   @returns {Store} The forked store.
  */
  fork(options = {}) {
    options.cacheOptions = options.cacheOptions || {};
    options.cacheOptions.base = this.cache;
    options.schema = this.schema;
    options.keyMap = this.keyMap;

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
  merge(forkedStore, { coalesce = true, sinceTransformId = null } = {}) {
    let transforms;
    if (sinceTransformId) {
      transforms = forkedStore.transformsSince(sinceTransformId);
    } else {
      transforms = forkedStore.allTransforms();
    }

    let reducedTransform;
    if (coalesce) {
      reducedTransform = coalesceTransforms(transforms);
    } else {
      reducedTransform = reduceTransforms(transforms);
    }

    return this.update(reducedTransform);
  }

  /**
   Rolls back the Store to a particular transformId

   @method rollback
   @param {string} transformId - The ID of the transform to roll back to
   @param {number} relativePosition - A positive or negative integer to specify a position relative to `transformId`
   @returns {undefined}
  */
  rollback(transformId, relativePosition = 0) {
    this.transformLog
      .after(transformId, relativePosition)
      .reverse()
      .forEach(id => this._rollbackTransform(id));

    this.transformLog.rollback(transformId, relativePosition);
  }

  /**
   Returns all transforms since a particular `transformId`.

   @method transformsSince
   @param {string} transformId - The ID of the transform to start with.
   @returns {Array} Array of transforms.
  */
  transformsSince(transformId) {
    return this.transformLog
      .after(transformId)
      .map(id => this._transforms[id]);
  }

  /**
   Returns all tracked transforms.

   @method allTransforms
   @returns {Array} Array of transforms.
  */
  allTransforms() {
    return this.transformLog.entries
      .map(id => this._transforms[id]);
  }

  /////////////////////////////////////////////////////////////////////////////
  // Private methods
  /////////////////////////////////////////////////////////////////////////////

  _applyTransform(transform) {
    const inverse = this.cache.patch(transform.operations);
    this._transforms[transform.id] = transform;
    this._transformInverses[transform.id] = inverse;
  }

  _clearTransformFromHistory(transformId) {
    delete this._transforms[transformId];
    delete this._transformInverses[transformId];
  }

  _logCleared(/* data */) {
    this._transforms = {};
    this._transformInverses = {};
  }

  _logTruncated(transformId, relativePosition, data) {
    const prevLog = new TransformLog(data);
    prevLog
      .before(transformId)
      .forEach(id => this._clearTransformFromHistory(id));
  }

  _rollbackTransform(transformId) {
    const inverseOperations = this._transformInverses[transformId];
    if (inverseOperations) {
      this.cache.patch(inverseOperations);
    }
    this._clearTransformFromHistory(transformId);
  }
}

Queryable.extend(Store.prototype);
Updatable.extend(Store.prototype);
Syncable.extend(Store.prototype);
