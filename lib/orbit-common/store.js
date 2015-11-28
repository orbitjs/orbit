import {
  addRecordOperation,
  replaceRecordOperation,
  removeRecordOperation,
  replaceAttributeOperation,
  addToHasManyOperation,
  removeFromHasManyOperation,
  replaceHasOneOperation,
  replaceHasManyOperation
} from 'orbit-common/lib/operations';
import {
  queryExpression as oqe
} from 'orbit-common/oql/expressions';
import MemorySource from 'orbit-common/memory-source';

export default MemorySource.extend({
  /////////////////////////////////////////////////////////////////////////////
  // Query helpers
  /////////////////////////////////////////////////////////////////////////////

  findRecordsByType(type) {
    return this.query({ oql: oqe('get', [type]) })
      .then((records) => {
        if (records) {
          return Object.keys(records).map((k) => records[k]);
        } else {
          return [];
        }
      });
  },

  findRecord(type, id) {
    return this.query({ oql: oqe('get', [type, id]) });
  },

  /////////////////////////////////////////////////////////////////////////////
  // Transform helpers
  /////////////////////////////////////////////////////////////////////////////

  addRecord(record) {
    return this.transform(addRecordOperation(this.schema.normalize(record)))
      .then(() => {
        return this.cache.get([record.type, record.id]);
      });
  },

  replaceRecord(record) {
    return this.transform(replaceRecordOperation(this.schema.normalize(record)));
  },

  removeRecord(record) {
    return this.transform(removeRecordOperation(record));
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
