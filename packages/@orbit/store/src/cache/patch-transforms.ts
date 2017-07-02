import {
  Record,
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
import { clone, deepGet, deepSet, merge } from '@orbit/utils';
import Cache from '../cache';

export interface PatchTransformFunc {
  (cache: Cache, op: RecordOperation): boolean;
}

export default {
  addRecord(cache: Cache, op: AddRecordOperation): boolean {
    const { type, id } = op.record;
    const records = cache.records(type);
    if (records.get(id) !== op.record) {
      records.set(id, op.record);
      return true;
    }
  },

  replaceRecord(cache: Cache, op: ReplaceRecordOperation): boolean {
    const replacement = op.record;
    const { type, id } = replacement;
    const records = cache.records(type);
    const current = records.get(id);
    if (current !== replacement) {
      let result: Record;

      if (current) {
        result = { type, id };

        ['attributes', 'keys', 'relationships'].forEach(grouping => {
          if (current[grouping] && replacement[grouping]) {
            result[grouping] = merge({}, current[grouping], replacement[grouping]);
          } else if (current[grouping]) {
            result[grouping] = current[grouping];
          } else if (replacement[grouping]) {
            result[grouping] = replacement[grouping];
          }
        });
      } else {
        result = replacement;
      }

      records.set(id, result);

      return true;
    }
  },

  removeRecord(cache: Cache, op: RemoveRecordOperation): boolean {
    const { type, id } = op.record;
    const records = cache.records(type);
    if (records.get(id)) {
      records.remove(id);
      return true;
    }
  },

  replaceKey(cache: Cache, op: ReplaceKeyOperation): boolean {
    const { type, id } = op.record;
    const records = cache.records(type);
    let record = records.get(id);
    if (record) {
      if (deepGet(record, ['keys', op.key]) === op.value) {
        return false;
      } else {
        record = clone(record);
      }
    } else {
      record = { type, id };
    }
    if (deepSet(record, ['keys', op.key], op.value)) {
      records.set(id, record);
      return true;
    }
  },

  replaceAttribute(cache: Cache, op: ReplaceAttributeOperation): boolean {
    const { type, id } = op.record;
    const records = cache.records(type);
    let record = records.get(id);
    if (record) {
      if (deepGet(record, ['attributes', op.attribute]) === op.value) {
        return false;
      } else {
        record = clone(record);
      }
    } else {
      record = { type, id };
    }
    if (deepSet(record, ['attributes', op.attribute], op.value)) {
      records.set(id, record);
      return true;
    }
  },

  addToRelatedRecords(cache: Cache, op: AddToRelatedRecordsOperation): boolean {
    const { type, id } = op.record;
    const records = cache.records(type);
    let record = records.get(id);
    if (record) {
      if (cache.relationships.relationshipExists(record, op.relationship, op.relatedRecord)) {
        return false;
      } else {
        record = clone(record);
      }
    } else {
      record = { type, id };
    }

    const relatedRecords = deepGet(record, ['relationships', op.relationship, 'data']) || [];
    relatedRecords.push(op.relatedRecord);

    if (deepSet(record, ['relationships', op.relationship, 'data'], relatedRecords)) {
      records.set(id, record);
      return true;
    }
  },

  removeFromRelatedRecords(cache: Cache, op: RemoveFromRelatedRecordsOperation): boolean {
    const { relatedRecord } = op;
    const { type, id } = op.record;
    const records = cache.records(type);
    let record = records.get(id);
    if (record) {
      if (cache.relationships.relationshipExists(record, op.relationship, op.relatedRecord)) {
        record = clone(record);

        let relatedRecords = deepGet(record, ['relationships', op.relationship, 'data']);
        relatedRecords = relatedRecords.filter(r => {
          return !(r.type === relatedRecord.type && r.id === relatedRecord.id);
        });

        if (deepSet(record, ['relationships', op.relationship, 'data'], relatedRecords)) {
          records.set(id, record);
          return true;
        }
      }
    }
    return false;
  },

  replaceRelatedRecords(cache: Cache, op: ReplaceRelatedRecordsOperation): boolean {
    const { type, id } = op.record;
    const records = cache.records(type);
    let record = records.get(id);
    if (record) {
      record = clone(record);
    } else {
      record = { type, id };
    }
    if (deepSet(record, ['relationships', op.relationship, 'data'], op.relatedRecords)) {
      records.set(id, record);
      return true;
    }
  },

  replaceRelatedRecord(cache: Cache, op: ReplaceRelatedRecordOperation): boolean {
    const { type, id } = op.record;
    const records = cache.records(type);
    let record = records.get(id);
    if (record) {
      if (cache.relationships.relationshipExists(record, op.relationship, op.relatedRecord)) {
        return false;
      } else {
        record = clone(record);
      }
    } else {
      record = { type, id };
    }
    if (deepSet(record, ['relationships', op.relationship, 'data'], op.relatedRecord)) {
      records.set(id, record);
      return true;
    }
  }
};
