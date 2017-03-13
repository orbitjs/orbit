import { 
  cloneRecordIdentity,
  serializeRecordIdentity,
  Record, RecordIdentity,
  AddRecordOperation,
  AddToHasManyOperation,
  ReplaceAttributeOperation,
  RemoveFromHasManyOperation,
  RemoveRecordOperation,
  ReplaceHasManyOperation,
  ReplaceHasOneOperation,
  ReplaceKeyOperation,
  ReplaceRecordOperation
} from '@orbit/core';
import {
  deepSet
} from '@orbit/utils';
import Source from '../source';

export default {
  addRecord(source: Source, operation: AddRecordOperation) {
    source.putRecord(operation.record);
  },

  replaceRecord(source: Source, operation: ReplaceRecordOperation) {
    source.putRecord(operation.record);
  },

  removeRecord(source: Source, operation: RemoveRecordOperation) {
    source.removeRecord(operation.record);
  },

  replaceKey(source: Source, operation: ReplaceKeyOperation) {
    let record: Record = source.getRecord(operation.record) || cloneRecordIdentity(operation.record);
    record.keys = record.keys || {};
    record.keys[operation.key] = operation.value;
    source.putRecord(record);
  },

  replaceAttribute(source: Source, operation: ReplaceAttributeOperation) {
    let record: Record = source.getRecord(operation.record) || cloneRecordIdentity(operation.record);
    record.attributes = record.attributes || {};
    record.attributes[operation.attribute] = operation.value;
    source.putRecord(record);
  },

  addToHasMany(source: Source, operation: AddToHasManyOperation) {
    let record: Record = source.getRecord(operation.record) || cloneRecordIdentity(operation.record);
    deepSet(record, ['relationships', operation.relationship, 'data', serializeRecordIdentity(operation.relatedRecord)], true);
    source.putRecord(record);
  },

  removeFromHasMany(source: Source, operation: RemoveFromHasManyOperation) {
    let record: Record = source.getRecord(operation.record);
    if (record &&
        record.relationships &&
        record.relationships[operation.relationship] &&
        record.relationships[operation.relationship].data &&
        record.relationships[operation.relationship].data[serializeRecordIdentity(operation.relatedRecord)]
    ) {
      delete record.relationships[operation.relationship].data[serializeRecordIdentity(operation.relatedRecord)];
      source.putRecord(record);
    }
  },

  replaceHasMany(source: Source, operation: ReplaceHasManyOperation) {
    let record: Record = source.getRecord(operation.record) || cloneRecordIdentity(operation.record);
    let data = {};
    operation.relatedRecords.forEach(relatedRecord => {
      data[serializeRecordIdentity(relatedRecord)] = true;
    });
    deepSet(record, ['relationships', operation.relationship, 'data'], data);
    source.putRecord(record);
  },

  replaceHasOne(source: Source, operation: ReplaceHasOneOperation) {
    let record: Record = source.getRecord(operation.record) || cloneRecordIdentity(operation.record);
    let data = operation.relatedRecord ? serializeRecordIdentity(operation.relatedRecord) : null;
    deepSet(record, ['relationships', operation.relationship, 'data'], data);
    source.putRecord(record);
  }
};
