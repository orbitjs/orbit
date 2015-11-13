import {
  addRecordOperation,
  replaceRecordOperation,
  removeRecordOperation,
  replaceAttributeOperation,
  addToRelationshipOperation,
  removeFromRelationshipOperation,
  replaceRelationshipOperation
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
    return this.query({oql: oqe('get', [type])})
      .then((records) => {
        if (records) {
          return Object.keys(records).map((k) => records[k]);
        } else {
          return [];          
        }
      });
  },

  findRecord(type, id) {
    return this.query({oql: oqe('get', [type, id])});
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

  addToRelationship(record, relationship, value) {
    return this.transform(addToRelationshipOperation(record, relationship, value));
  },

  removeFromRelationship(record, relationship, value) {
    return this.transform(removeFromRelationshipOperation(record, relationship, value));
  },

  replaceRelationship(record, relationship, value) {
    return this.transform(replaceRelationshipOperation(record, relationship, value));
  }
});
