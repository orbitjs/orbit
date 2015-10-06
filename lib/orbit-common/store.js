import {
  Class,
  expose,
  isObject
} from 'orbit/lib/objects';
import Evented from 'orbit/evented';
import {
  addRecordOperation,
  replaceRecordOperation,
  removeRecordOperation,
  replaceAttributeOperation,
  addToRelationshipOperation,
  removeFromRelationshipOperation,
  replaceRelationshipOperation
} from 'orbit-common/lib/operations';
import MemorySource from 'orbit-common/memory-source';

export default Class.extend({
  init({schema}) {
    Evented.extend(this);

    this._schema = schema;
    this._source = new MemorySource({schema});
    expose(this, this._source, 'query', 'transform');

    this._source.on('didTransform', transform => this.emit('didTransform', transform));
  },

  addRecord(record) {
    return this.transform(addRecordOperation(this._normalize(record)))
      .then(() => {
        return this.retrieve([record.type, record.id]);
      });
  },

  replaceRecord(record) {
    return this.transform(replaceRecordOperation(this._normalize(record)));
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
  },

  retrieveRelationship({type, id}, relationship) {
    const value = this.retrieve([type, id, 'relationships', relationship, 'data']);

    return isObject(value) ? Object.keys(value) : value;
  },

  retrieveRecord(type, id){
    return this.retrieve([type, id]);
  },

  _normalize(...args) {
    return this._schema.normalize(...args);
  }
});
