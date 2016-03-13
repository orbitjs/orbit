import {
  queryExpression as oqe
} from 'orbit/query/expression';
import {
  addRecordOperation,
  replaceRecordOperation,
  removeRecordOperation,
  replaceAttributeOperation,
  addToHasManyOperation,
  removeFromHasManyOperation,
  replaceHasOneOperation,
  replaceHasManyOperation,
  replaceKeyOperation
} from 'orbit-common/lib/operations';
import MemorySource from 'orbit-common/memory-source';
import Transform from 'orbit/transform';
import Evented from 'orbit/evented';
import Cache from 'orbit-common/cache';
import TransformBuilder from 'orbit-common/transform/builder';
import TransformTracker from 'orbit-common/transform/tracker';

export default class Store {
  constructor(opts) {
    Evented.extend(this);
    this.schema = opts.schema;
    this._transformBuilder = new TransformBuilder();
    this._transformTracker = new TransformTracker();
    this.cache = new Cache(opts.schema);
  }

  /////////////////////////////////////////////////////////////////////////////
  // Query helpers
  /////////////////////////////////////////////////////////////////////////////

  findRecordsByType(type) {
    return this.query(oqe('get', [type]))
      .then((records) => {
        if (records) {
          return Object.keys(records).map(k => records[k]);
        } else {
          return [];
        }
      });
  }

  findRecord(type, id) {
    return this.query(oqe('get', [type, id]));
  }

  /////////////////////////////////////////////////////////////////////////////
  // Transform helpers
  /////////////////////////////////////////////////////////////////////////////

  addRecord(record) {
    return this
      .update(t => t.addRecord(this.schema.normalize(record)))
      .then(() => this.cache.get([record.type, record.id]));
  }

  replaceRecord(record) {
    return this
      .update(t => t.replaceRecord(this.schema.normalize(record)))
      .then(() => this.cache.get([record.type, record.id]));
  }

  removeRecord(record) {
    return this.update(t => t.removeRecord(record));
  }

  replaceKey(record, key, value) {
    return this.update(t => t.replaceKey(record, key, value));
  }

  replaceAttribute(record, attribute, value) {
    return this.update(t => t.replaceAttribute(record, attribute, value));
  }

  addToHasMany(record, relationship, value) {
    return this.update(t => t.addToHasMany(record, relationship, value));
  }

  removeFromHasMany(record, relationship, value) {
    return this.update(t => t.removeFromHasMany(record, relationship, value));
  }

  replaceHasMany(record, relationship, value) {
    return this.update(t => t.replaceHasMany(record, relationship, value));
  }

  replaceHasOne(record, relationship, value) {
    return this.update(t => t.replaceHasOne(record, relationship, value));
  }

  confirm(transform) {
    this.cache.transform(transform);
    this._transformTracker.confirm(transform);
  }

  deny(transform, error) {
    this._transformTracker.deny(transform, error);
  }

  update(transformSpecification) {
    const transform = Transform.from(transformSpecification, this._transformBuilder);
    const promisedResolution = this._transformTracker.add(transform);

    this.emit('transform', transform);

    return promisedResolution;
  }

  query(queryCallback) {
    return this
      .resolve('fetch', queryCallback)
      .then(transforms => {
        if (transforms.length === 0) { return; }
        return this._transformTracker.add(transforms.slice(-1)[0]);
      })
      .then(() => this.cache.query(queryCallback));
  }

  liveQuery(expression) {
    return this.resolve('subscription').then(sourceObservable => {
      const cacheObservable = this.cache.liveQuery(expression);

      // Merge the two observables so they can be created/disposed together.
      // We only want events from the cacheObservable though so empty() is used
      // to ignore events from the sourceObservable.
      return sourceObservable.empty().merge(cacheObservable);
    });
  }

  _hasTransformListeners() {
    return this.listeners('transform').length > 0;
  }
}
