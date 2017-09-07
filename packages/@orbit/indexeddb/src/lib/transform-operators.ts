import {
  mergeRecords,
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
    let updates = operation.record;

    return source.getRecord(updates)
      .catch(() => null)
      .then(current => {
        let record = mergeRecords(current, updates);
        return source.putRecord(record);
      });
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
        let relationships = deepGet(record, ['relationships', operation.relationship, 'data']);
        if (relationships) {
          relationships.push(operation.relatedRecord);
        } else {
          deepSet(record, ['relationships', operation.relationship, 'data'], [operation.relatedRecord]);
        }
        return source.putRecord(record);
      });
  },

  removeFromRelatedRecords(source: Source, operation: RemoveFromRelatedRecordsOperation) {
    return getRecord(source, operation.record)
      .then(record => {
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
      });
  },

  replaceRelatedRecords(source: Source, operation: ReplaceRelatedRecordsOperation) {
    return getRecord(source, operation.record)
      .then(record => {
        deepSet(record, ['relationships', operation.relationship, 'data'], operation.relatedRecords);
        return source.putRecord(record);
      });
  },

  replaceRelatedRecord(source: Source, operation: ReplaceRelatedRecordOperation) {
    return getRecord(source, operation.record)
      .then(record => {
        deepSet(record, ['relationships', operation.relationship, 'data'], operation.relatedRecord);
        return source.putRecord(record);
      });
  }
};
