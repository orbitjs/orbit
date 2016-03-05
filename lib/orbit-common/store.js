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
import { Class, expose } from 'orbit/lib/objects';
import Transform from 'orbit/transform';
import Evented from 'orbit/evented';
import TransformTracker from 'orbit-common/coordinators/transform-tracker';
import Cache from 'orbit-common/cache';

export default Class.extend({
  init(opts) {
    Evented.extend(this);
    this.schema = opts.schema;
    this._transformTracker = new TransformTracker();
    this.cache = new Cache(opts.schema);
  },

  /////////////////////////////////////////////////////////////////////////////
  // Query helpers
  /////////////////////////////////////////////////////////////////////////////

  findRecordsByType(type) {
    return this.query(oqe('get', [type]))
      .then((records) => {
        if (records) {
          return Object.keys(records).map((k) => records[k]);
        } else {
          return [];
        }
      });
  },

  findRecord(type, id) {
    return this.query(oqe('get', [type, id]));
  },

  /////////////////////////////////////////////////////////////////////////////
  // Transform helpers
  /////////////////////////////////////////////////////////////////////////////

  addRecord(record) {
    return this
      .transform(addRecordOperation(this.schema.normalize(record)))
      .then(() => this.cache.get([record.type, record.id]));
  },

  replaceRecord(record) {
    return this.transform(replaceRecordOperation(this.schema.normalize(record)));
  },

  removeRecord(record) {
    return this.transform(removeRecordOperation(record));
  },

  replaceKey(record, key, value) {
    return this.transform(replaceKeyOperation(record, key, value));
  },

  replaceAttribute(record, attribute, value) {
    return this.transform(replaceAttributeOperation(record, attribute, value));
  },

  addToHasMany(record, relationship, value) {
    return this.transform(addToHasManyOperation(record, relationship, value));
  },

  removeFromHasMany(record, relationship, value) {
    return this.transform(removeFromHasManyOperation(record, relationship, value));
  },

  replaceHasMany(record, relationship, value) {
    return this.transform(replaceHasManyOperation(record, relationship, value));
  },

  replaceHasOne(record, relationship, value) {
    return this.transform(replaceHasOneOperation(record, relationship, value));
  },

  confirm(transform) {
    this.cache.transform(transform);
    this._transformTracker.confirm(transform);
  },

  deny(transform, error) {
    this._transformTracker.deny(transform, error);
  },

  transform(transformOrOperation) {
    const transform = Transform.from(transformOrOperation);
    const promisedResolution = this._transformTracker.add(transform);
    this.emit('transform', transform);

    return promisedResolution;
  }
});
