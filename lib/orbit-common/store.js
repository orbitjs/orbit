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

export default Class.extend({
  init(opts) {
    this.coordinator = new MemorySource(opts);
    expose(this, this.coordinator, 'query', 'transform', 'cache', 'schema');
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
    return this.coordinator.transform(addRecordOperation(this.schema.normalize(record)))
      .then(() => {
        return this.coordinator.cache.get([record.type, record.id]);
      });
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
  }
});
