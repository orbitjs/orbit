import Orbit from 'orbit/main';
import { assert } from 'orbit/lib/assert';
import { extend as assign } from 'orbit/lib/objects';
import Source from './source';
import Queryable from 'orbit/queryable';
import Updatable from 'orbit/updatable';
import Cache from './cache';

export default class Store extends Source {
  constructor({ schema, keyMap, cacheOptions, name } = {}) {
    assert('Store\'s `keyMap` must be specified in `options.keyMap` constructor argument', keyMap);

    super(...arguments);

    Queryable.extend(this);
    Updatable.extend(this);

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
    const inverse = this.cache.patch(transform.operations);

    this._transforms[transform.id] = transform;
    this._transformInverses[transform.id] = inverse;

    return Orbit.Promise.resolve([transform]);
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
