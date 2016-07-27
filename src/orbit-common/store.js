import Orbit from 'orbit/main';
import { assert } from 'orbit/lib/assert';
import { extend as assign } from 'orbit/lib/objects';
import Source from './source';
import Transformable from 'orbit/interfaces/transformable';
import Queryable from 'orbit/interfaces/queryable';
import Updatable from 'orbit/interfaces/updatable';
import Cache from './cache';
import {
  coalesceTransforms,
  reduceTransforms
} from './lib/transforms';

export default class Store extends Source {
  constructor({ schema, keyMap, cacheOptions, name } = {}) {
    super(...arguments);

    assert('Store\'s `keyMap` must be specified in `options.keyMap` constructor argument', keyMap);

    this.keyMap = keyMap;
    this.name = name || 'store';

    this._transforms = {};
    this._transformInverses = {};

    this.cache = new Cache(assign({ schema, keyMap }, cacheOptions));
  }

  /////////////////////////////////////////////////////////////////////////////
  // Transformable interface implementation
  /////////////////////////////////////////////////////////////////////////////

  _transform(transform) {
    this._applyTransform(transform);
    return Orbit.Promise.resolve([transform]);
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
   @returns {undefined}
  */
  rollback(transformId) {
    this.transformLog
      .after(transformId)
      .reverse()
      .forEach(id => this._rollbackTransform(id));

    this.transformLog.rollback(transformId);
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
    return this.transformLog
      .entries()
      .map(id => this._transforms[id]);
  }

  /**
   Truncates the Source's logged and tracked transforms to remove everything
   before a particular `transformId`.

   @method truncateHistory
   @param {string} transformId - The ID of the transform to truncate history to.
   @returns {undefined}
  */
  truncateHistory(transformId) {
    super.truncateHistory(...arguments);

    this.transformLog
      .before(transformId)
      .forEach(id => this._clearTransformFromHistory(id));
  }

  /**
   Clears the Source's logged and tracked transforms entirely.

   @method clearHistory
   @returns {undefined}
  */
  clearHistory() {
    super.clearHistory(...arguments);

    this._transforms = {};
    this._transformInverses = {};
  }

  /////////////////////////////////////////////////////////////////////////////
  // Private methods
  /////////////////////////////////////////////////////////////////////////////

  _applyTransform(transform) {
    const inverse = this.cache.patch(transform.operations);
    this._transforms[transform.id] = transform;
    this._transformInverses[transform.id] = inverse;
  }

  _rollbackTransform(transformId) {
    const inverseOperations = this._transformInverses[transformId];
    if (inverseOperations) {
      this.cache.patch(inverseOperations);
    }
    this._clearTransformFromHistory(transformId);
  }

  _clearTransformFromHistory(transformId) {
    delete this._transforms[transformId];
    delete this._transformInverses[transformId];
  }
}

Queryable.extend(Store.prototype);
Updatable.extend(Store.prototype);
Transformable.extend(Store.prototype);
