import Orbit from 'orbit/main';
import { assert } from 'orbit/lib/assert';
import Source from './source';
import Queryable from 'orbit/queryable';
import Updatable from 'orbit/updatable';
import Transformable from 'orbit/transformable';
import Cache from './cache';
import { extend as assign } from 'orbit/lib/objects';

export default class Store extends Source {
  constructor({ schema, keyMap, cacheOptions, name } = {}) {
    assert('Store\'s `keyMap` must be specified in `options.keyMap` constructor argument', keyMap);

    super(...arguments);

    Queryable.extend(this);
    Updatable.extend(this);
    Transformable.extend(this);

    this.keyMap = keyMap;
    this.name = name || 'store';

    this.cache = new Cache(assign({}, { schema, keyMap }, cacheOptions));
  }

  /////////////////////////////////////////////////////////////////////////////
  // Transformable interface implementation
  /////////////////////////////////////////////////////////////////////////////

  _transform(transform) {
    this.cache.transform(transform);
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
}
