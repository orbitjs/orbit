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
  ReplaceRecordOperation,
  equalRecordIdentities
} from '@orbit/data';
import { clone, deepGet, deepSet, merge } from '@orbit/utils';
import Cache, { PatchResultData } from '../cache';

export interface PatchTransformFunc {
  (cache: Cache, op: RecordOperation): PatchResultData;
}

export default {
  addRecord(cache: Cache, op: AddRecordOperation): PatchResultData {
    let record = op.record;
    const records = cache.records(record.type);
    records.set(record.id, record);

    if (cache.keyMap) {
      cache.keyMap.pushRecord(record);
    }

    return record;
  },

  replaceRecord(cache: Cache, op: ReplaceRecordOperation): PatchResultData {
    const replacement = op.record;
    const { type, id } = replacement;
    const records = cache.records(type);
    const current = records.get(id);
    let record: Record;

    if (current) {
      record = { type, id };

      ['attributes', 'keys', 'relationships'].forEach(grouping => {
        if (current[grouping] && replacement[grouping]) {
          record[grouping] = merge({}, current[grouping], replacement[grouping]);
        } else if (current[grouping]) {
          record[grouping] = merge({}, current[grouping]);
        } else if (replacement[grouping]) {
          record[grouping] = merge({}, replacement[grouping]);
        }
      });
    } else {
      record = replacement;
    }

    records.set(id, record);

    if (cache.keyMap) {
      cache.keyMap.pushRecord(record);
    }

    return record;
  },

  removeRecord(cache: Cache, op: RemoveRecordOperation): PatchResultData {
    const { type, id } = op.record;
    const records = cache.records(type);
    const result = records.get(id);
    if (result) {
      records.remove(id);
      return result;
    } else {
      return null;
    }
  },

  replaceKey(cache: Cache, op: ReplaceKeyOperation): PatchResultData {
    const { type, id } = op.record;
    const records = cache.records(type);
    let record = records.get(id);
    if (record) {
      record = clone(record);
    } else {
      record = { type, id };
    }
    deepSet(record, ['keys', op.key], op.value);
    records.set(id, record);

    if (cache.keyMap) {
      cache.keyMap.pushRecord(record);
    }

    return record;
  },

  replaceAttribute(cache: Cache, op: ReplaceAttributeOperation): PatchResultData {
    const { type, id } = op.record;
    const records = cache.records(type);
    let record = records.get(id);
    if (record) {
      record = clone(record);
    } else {
      record = { type, id };
    }
    deepSet(record, ['attributes', op.attribute], op.value);
    records.set(id, record);
    return record;
  },

  addToRelatedRecords(cache: Cache, op: AddToRelatedRecordsOperation): PatchResultData {
    const { type, id } = op.record;
    const records = cache.records(type);
    let record = records.get(id);
    if (record) {
      record = clone(record);
    } else {
      record = { type, id };
    }
    const relatedRecords = deepGet(record, ['relationships', op.relationship, 'data']) || [];
    relatedRecords.push(op.relatedRecord);

    deepSet(record, ['relationships', op.relationship, 'data'], relatedRecords);
    records.set(id, record);
    return record;
  },

  removeFromRelatedRecords(cache: Cache, op: RemoveFromRelatedRecordsOperation): PatchResultData {
    const { type, id } = op.record;
    const records = cache.records(type);
    let record = records.get(id);
    if (record) {
      record = clone(record);
      let relatedRecords = deepGet(record, ['relationships', op.relationship, 'data']) as RecordIdentity[];
      if (relatedRecords) {
        relatedRecords = relatedRecords.filter(r => !equalRecordIdentities(r, op.relatedRecord));

        if (deepSet(record, ['relationships', op.relationship, 'data'], relatedRecords)) {
          records.set(id, record);
        }
      }
      return record;
    }
    return null;
  },

  replaceRelatedRecords(cache: Cache, op: ReplaceRelatedRecordsOperation): PatchResultData {
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
    }
    return record;
  },

  replaceRelatedRecord(cache: Cache, op: ReplaceRelatedRecordOperation): PatchResultData {
    const { type, id } = op.record;
    const records = cache.records(type);
    let record = records.get(id);
    if (record) {
      record = clone(record);
    } else {
      record = { type, id };
    }
    if (deepSet(record, ['relationships', op.relationship, 'data'], op.relatedRecord)) {
      records.set(id, record);
    }
    return record;
  }
};
