import {
  Class,
  expose
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
    expose(this, this._source, 'retrieve', 'reset');

    this._source.on('didTransform', transform => this.emit('didTransform', transform));
  },

  addRecord(record) {
    return this._transform(addRecordOperation(this._normalize(record)))
      .then(() => {
        return this.retrieve([record.type, record.id]);
      });
  },

  replaceRecord(record) {
    return this._transform(replaceRecordOperation(this._normalize(record)));
  },

  removeRecord(record) {
    return this._transform(removeRecordOperation(record));
  },

  replaceAttribute(record, attribute, value) {
    return this._transform(replaceAttributeOperation(record, attribute, value));
  },

  addToRelationship(record, relationship, value) {
    return this._transform(addToRelationshipOperation(record, relationship, value));
  },

  removeFromRelationship(record, relationship, value) {
    return this._transform(removeFromRelationshipOperation(record, relationship, value));
  },

  replaceRelationship(record, relationship, value) {
    return this._transform(replaceRelationshipOperation(record, relationship, value));
  },

  _transform(...args) {
    return this._source.transform(...args);
  },

  _normalize(...args) {
    return this._schema.normalize(...args);
  }
});
