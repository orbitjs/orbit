import Orbit from 'orbit/main';
import { assert } from 'orbit/lib/assert';
import Source from 'orbit/source';
import Queryable from 'orbit/queryable';
import Updatable from 'orbit/updatable';
import Transformable from 'orbit/transformable';
import Cache from './cache';
import TransformBuilder from './transform/builder';

export default class Store extends Source {
  constructor(options = {}) {
    assert('Store\'s `schema` must be specified in `options.schema` constructor argument', options.schema);

    super(options);

    Queryable.extend(this);
    Updatable.extend(this);
    Transformable.extend(this);

    this.schema = options.schema;
    this.name = options.name || 'store';

    this.transformBuilder = new TransformBuilder();
    this.cache = new Cache(options.schema, options.cacheOptions);
  }

  /////////////////////////////////////////////////////////////////////////////
  // Updatable interface implementation
  /////////////////////////////////////////////////////////////////////////////

  _update(transform) {
    return this._transform(transform);
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
  // LiveQuery interface implementation
  /////////////////////////////////////////////////////////////////////////////

  liveQuery(/* expression */) {
    throw new Error('coming soon');
  }
}
