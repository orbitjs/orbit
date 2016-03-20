import { assert } from 'orbit/lib/assert';
import Query from 'orbit/query';
import Queryable from 'orbit/queryable';
import Updatable from 'orbit/updatable';
import Cache from 'orbit-common/cache';
import QueryBuilder from 'orbit-common/query/builder';
import TransformBuilder from 'orbit-common/transform/builder';
import RequestTracker from 'orbit-common/request-tracker';

export default class Store {
  constructor(options) {
    assert('Store constructor requires `options`', options);
    assert('Store\'s `schema` must be specified in `options.schema` constructor argument', options.schema);

    Queryable.extend(this);
    Updatable.extend(this);

    this.schema = options.schema;
    this.queryBuilder = new QueryBuilder();
    this.transformBuilder = new TransformBuilder();

    this._updateTracker = new RequestTracker();
    this._fetchTracker = new RequestTracker();

    this.cache = new Cache(options.schema, options.cacheOptions);
  }

  /////////////////////////////////////////////////////////////////////////////
  // Request confirmation
  /////////////////////////////////////////////////////////////////////////////

  confirmUpdate(transform) {
    this.cache.transform(transform);
    this._updateTracker.confirm(transform.id);
  }

  denyUpdate(transform, error) {
    this._updateTracker.deny(transform.id, error);
  }

  confirmFetch(query, transforms) {
    transforms.forEach(t => this.cache.transform(t));
    this._fetchTracker.confirm(query.id);
  }

  denyFetch(query, error) {
    this._fetchTracker.deny(query.id, error);
  }

  /////////////////////////////////////////////////////////////////////////////
  // Updatable interface implementation
  /////////////////////////////////////////////////////////////////////////////

  _update(transform) {
    const promisedResolution = this._updateTracker.add(transform.id);

    this.emit('updateRequest', transform);

    return promisedResolution
      .then(() => [transform]);
  }

  /////////////////////////////////////////////////////////////////////////////
  // Queryable interface implementation
  /////////////////////////////////////////////////////////////////////////////

  _query(query) {
    const promisedResolution = this._fetchTracker.add(query.id);

    this.emit('fetchRequest', query);

    return promisedResolution
      .then(() => this.cache.query(query));
  }

  /////////////////////////////////////////////////////////////////////////////
  // LiveQuery interface implementation
  /////////////////////////////////////////////////////////////////////////////

  liveQuery(expression) {
    return this.resolve('subscription').then(sourceObservable => {
      const cacheObservable = this.cache.liveQuery(expression);

      // Merge the two observables so they can be created/disposed together.
      // We only want events from the cacheObservable though so empty() is used
      // to ignore events from the sourceObservable.
      return sourceObservable.empty().merge(cacheObservable);
    });
  }
}
