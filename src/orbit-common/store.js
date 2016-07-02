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

    this._transformInverses = {};

    this.cache = new Cache(assign({ schema, keyMap }, cacheOptions));
  }

  /////////////////////////////////////////////////////////////////////////////
  // Transformable interface implementation
  /////////////////////////////////////////////////////////////////////////////

  _transform(transform) {
    const inverse = this.cache.patch(transform.operations);

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
   @param {string} transformId The ID of the transform to roll back to
   @returns {undefined}
  */
  rollback(transformId) {
    this.transformLog
      .after(transformId)
      .reverse()
      .forEach((id) => this._rollbackTransform(id));

    this.transformLog.rollback(transformId);
  }

  /////////////////////////////////////////////////////////////////////////////
  // Private methods
  /////////////////////////////////////////////////////////////////////////////

  _rollbackTransform(transformId) {
    const inverseOperations = this._transformInverses[transformId];
    this.cache.patch(inverseOperations);
  }
}
