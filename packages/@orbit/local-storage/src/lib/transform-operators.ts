import {
  cloneRecordIdentity,
  equalRecordIdentities,
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
  deepGet,
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

  addToRelatedRecords(source: Source, operation: AddToRelatedRecordsOperation) {
    let record: Record = source.getRecord(operation.record) || cloneRecordIdentity(operation.record);
    let relationships = deepGet(record, ['relationships', operation.relationship, 'data']);
    if (relationships) {
      relationships.push(operation.relatedRecord);
    } else {
      deepSet(record, ['relationships', operation.relationship, 'data'], [operation.relatedRecord]);
    }
    source.putRecord(record);
  },

  removeFromRelatedRecords(source: Source, operation: RemoveFromRelatedRecordsOperation) {
    let record: Record = source.getRecord(operation.record);
    let relationships = deepGet(record, ['relationships', operation.relationship, 'data']) as RecordIdentity[];
    if (relationships) {
      for (let i = 0, l = relationships.length; i < l; i++) {
        if (equalRecordIdentities(relationships[i], operation.relatedRecord)) {
          relationships.splice(i, 1);
          break;
        }
      }
      return source.putRecord(record);
    }
  },

  replaceRelatedRecords(source: Source, operation: ReplaceRelatedRecordsOperation) {
    let record: Record = source.getRecord(operation.record) || cloneRecordIdentity(operation.record);
    deepSet(record, ['relationships', operation.relationship, 'data'], operation.relatedRecords);
    source.putRecord(record);
  },

  replaceRelatedRecord(source: Source, operation: ReplaceRelatedRecordOperation) {
    let record: Record = source.getRecord(operation.record) || cloneRecordIdentity(operation.record);
    deepSet(record, ['relationships', operation.relationship, 'data'], operation.relatedRecord);
    source.putRecord(record);
  }
};
