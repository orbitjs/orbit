import {
  cloneRecordIdentity,
  serializeRecordIdentity,
  Record, RecordIdentity,
  AddRecordOperation,
  AddToRelatedRecordsOperation,
  ReplaceAttributeOperation,
  RemoveFromRelatedRecordsOperation,
  RemoveRecordOperation,
  ReplaceRelatedRecordsOperation,
  ReplaceRelatedRecordOperation,
  ReplaceKeyOperation,
  ReplaceRecordOperation
} from '@orbit/data';
import {
  deepSet
} from '@orbit/utils';
import Source from '../source';

function getRecord(source: Source, record: RecordIdentity): Promise<Record> {
  return source.getRecord(record)
    .catch(() => {
      return cloneRecordIdentity(record);
    });
}

export default {
  addRecord(source: Source, operation: AddRecordOperation) {
    return source.putRecord(operation.record);
  },

  replaceRecord(source: Source, operation: ReplaceRecordOperation) {
    return source.putRecord(operation.record);
  },

  removeRecord(source: Source, operation: RemoveRecordOperation) {
    return source.removeRecord(operation.record);
  },

  replaceKey(source: Source, operation: ReplaceKeyOperation) {
    return getRecord(source, operation.record)
      .then(record => {
        record.keys = record.keys || {};
        record.keys[operation.key] = operation.value;
        return source.putRecord(record);
      });
  },

  replaceAttribute(source: Source, operation: ReplaceAttributeOperation) {
    return getRecord(source, operation.record)
      .then(record => {
        record.attributes = record.attributes || {};
        record.attributes[operation.attribute] = operation.value;
        return source.putRecord(record);
      });
  },

  addToRelatedRecords(source: Source, operation: AddToRelatedRecordsOperation) {
    return getRecord(source, operation.record)
      .then(record => {
        deepSet(record, ['relationships', operation.relationship, 'data', serializeRecordIdentity(operation.relatedRecord)], true);
        return source.putRecord(record);
      });
  },

  removeFromRelatedRecords(source: Source, operation: RemoveFromRelatedRecordsOperation) {
    return getRecord(source, operation.record)
      .then(record => {
        if (record &&
            record.relationships &&
            record.relationships[operation.relationship] &&
            record.relationships[operation.relationship].data &&
            record.relationships[operation.relationship].data[serializeRecordIdentity(operation.relatedRecord)]
        ) {
          delete record.relationships[operation.relationship].data[serializeRecordIdentity(operation.relatedRecord)];
          return source.putRecord(record);
        }
      });
  },

  replaceRelatedRecords(source: Source, operation: ReplaceRelatedRecordsOperation) {
    return getRecord(source, operation.record)
      .then(record => {
        let data = {};
        operation.relatedRecords.forEach(relatedRecord => {
          data[serializeRecordIdentity(relatedRecord)] = true;
        });
        deepSet(record, ['relationships', operation.relationship, 'data'], data);
        return source.putRecord(record);
      });
  },

  replaceRelatedRecord(source: Source, operation: ReplaceRelatedRecordOperation) {
    return getRecord(source, operation.record)
      .then(record => {
        let data = operation.relatedRecord ? serializeRecordIdentity(operation.relatedRecord) : null;
        deepSet(record, ['relationships', operation.relationship, 'data'], data);
        return source.putRecord(record);
      });
  }
};
