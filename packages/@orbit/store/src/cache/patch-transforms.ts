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
import Cache from '../cache';

export interface PatchTransformFunc {
  (cache: Cache, op: RecordOperation): void;
}

export default {
  addRecord(cache: Cache, op: AddRecordOperation): void {
    const { type, id } = op.record;
    const records = cache.records(type);
    records.set(id, op.record);
  },

  replaceRecord(cache: Cache, op: ReplaceRecordOperation): void {
    const replacement = op.record;
    const { type, id } = replacement;
    const records = cache.records(type);
    const current = records.get(id);
    let result: Record;

    if (current) {
      result = { type, id };

      ['attributes', 'keys', 'relationships'].forEach(grouping => {
        if (current[grouping] && replacement[grouping]) {
          result[grouping] = merge({}, current[grouping], replacement[grouping]);
        } else if (current[grouping]) {
          result[grouping] = merge({}, current[grouping]);
        } else if (replacement[grouping]) {
          result[grouping] = merge({}, replacement[grouping]);
        }
      });
    } else {
      result = replacement;
    }

    records.set(id, result);
  },

  removeRecord(cache: Cache, op: RemoveRecordOperation): void {
    const { type, id } = op.record;
    const records = cache.records(type);
    records.remove(id);
  },

  replaceKey(cache: Cache, op: ReplaceKeyOperation): void {
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
  },

  replaceAttribute(cache: Cache, op: ReplaceAttributeOperation): void {
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
  },

  addToRelatedRecords(cache: Cache, op: AddToRelatedRecordsOperation): void {
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
  },

  removeFromRelatedRecords(cache: Cache, op: RemoveFromRelatedRecordsOperation): boolean {
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
          return true;
        }
      }
    }
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
      record = clone(record);
    } else {
      record = { type, id };
    }
    if (deepSet(record, ['relationships', op.relationship, 'data'], op.relatedRecord)) {
      records.set(id, record);
      return true;
    }
  }
};
