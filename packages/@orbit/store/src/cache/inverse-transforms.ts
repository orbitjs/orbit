import { deepGet, eq } from '@orbit/utils';
import {
  RecordIdentity,
  RecordOperation,
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
import Cache from '../cache';

export interface InverseTransformFunc {
  (cache: Cache, op: RecordOperation): RecordOperation;
}

const InverseTransforms = {
  addRecord(cache: Cache, op: AddRecordOperation | ReplaceRecordOperation): RecordOperation {
    const { type, id } = op.record;
    const current = cache.records(type).get(id);

    if (current === undefined) {
      return {
        op: 'removeRecord',
        record: { type, id }
      };
    } else if (eq(current, op.record)) {
      return;
    } else {
      return {
        op: 'replaceRecord',
        record: current
      };
    }
  },

  replaceRecord(cache: Cache, op: ReplaceRecordOperation): RecordOperation {
    const replacement = op.record;
    const { type, id } = replacement;
    const current = cache.records(type).get(id);

    if (current === undefined) {
      return {
        op: 'removeRecord',
        record: { type, id }
      };
    } else if (eq(current, replacement)) {
      return;
    } else {
      let result = { type, id };

      ['attributes', 'keys', 'relationships'].forEach(grouping => {
        if (replacement[grouping]) {
          result[grouping] = {};
          Object.keys(replacement[grouping]).forEach(field => {
            if (replacement[grouping].hasOwnProperty(field)) {
              if (current[grouping] && current[grouping].hasOwnProperty(field)) {
                result[grouping][field] = current[grouping][field];
              } else {
                result[grouping][field] = null;
              }
            }
          });
        }
      });

      return {
        op: 'replaceRecord',
        record: result
      };
    }
  },

  removeRecord(cache: Cache, op: RemoveRecordOperation): RecordOperation {
    const { type, id } = op.record;
    const current = cache.records(type).get(id);

    if (current !== undefined) {
      return {
        op: 'replaceRecord',
        record: current
      };
    }
  },

  replaceKey(cache: Cache, op: ReplaceKeyOperation): RecordOperation {
    const { type, id } = op.record;
    const record = cache.records(type).get(id);
    const current = record && deepGet(record, ['keys', op.key]);

    if (!eq(current, op.value)) {
      return {
        op: 'replaceKey',
        record: { type, id },
        key: op.key,
        value: current
      };
    }
  },

  replaceAttribute(cache: Cache, op: ReplaceAttributeOperation): RecordOperation {
    const { type, id } = op.record;
    const { attribute } = op;
    const record = cache.records(type).get(id);
    const current = record && deepGet(record, ['attributes', attribute]);

    if (!eq(current, op.value)) {
      return {
        op: 'replaceAttribute',
        record: { type, id },
        attribute,
        value: current
      };
    }
  },

  addToRelatedRecords(cache: Cache, op: AddToRelatedRecordsOperation): RecordOperation {
    const { record, relationship, relatedRecord } = op;
    if (!cache.relationships.relationshipExists(record, relationship, relatedRecord)) {
      return {
        op: 'removeFromRelatedRecords',
        record,
        relationship,
        relatedRecord
      };
    }
  },

  removeFromRelatedRecords(cache: Cache, op: RemoveFromRelatedRecordsOperation): RecordOperation {
    const { record, relationship, relatedRecord } = op;
    if (cache.relationships.relationshipExists(record, relationship, relatedRecord)) {
      return {
        op: 'addToRelatedRecords',
        record,
        relationship,
        relatedRecord
      };
    }
  },

  replaceRelatedRecords(cache: Cache, op: ReplaceRelatedRecordsOperation): RecordOperation {
    const { type, id } = op.record;
    const { relationship } = op;
    const record = cache.records(type).get(id);
    const currentValue = record && deepGet(record, ['relationships', relationship, 'data']);
    let currentRecords = currentValue ? currentValue : [];

    if (!eq(currentRecords, op.relatedRecords)) {
      return {
        op: 'replaceRelatedRecords',
        record: { type, id },
        relationship,
        relatedRecords: currentRecords
      };
    }
  },

  replaceRelatedRecord(cache: Cache, op: ReplaceRelatedRecordOperation): RecordOperation {
    const { type, id } = op.record;
    const { relationship } = op;
    const record = cache.records(type).get(id);
    const currentRecord = record && deepGet(record, ['relationships', relationship, 'data']);

    if (!eq(currentRecord, op.relatedRecord)) {
      return {
        op: 'replaceRelatedRecord',
        record: { type, id },
        relationship: relationship,
        relatedRecord: currentRecord
      };
    }
  }
};

export default InverseTransforms;
