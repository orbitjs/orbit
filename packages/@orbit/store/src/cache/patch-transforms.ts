import {
  serializeRecordIdentity,
  Record,
  RecordIdentity,
  RecordOperation,
  AddRecordOperation,
  AddToHasManyOperation,
  ReplaceAttributeOperation,
  RemoveFromHasManyOperation,
  RemoveRecordOperation,
  ReplaceHasManyOperation,
  ReplaceHasOneOperation,
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
          if (current[grouping]) {
            result[grouping] = merge(current[grouping], replacement[grouping]);
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

  addToHasMany(cache: Cache, op: AddToHasManyOperation): boolean {
    const { type, id } = op.record;
    const records = cache.records(type);
    const relatedIdentifier = serializeRecordIdentity(op.relatedRecord);
    let record = records.get(id);
    if (record) {
      if (deepGet(record, ['relationships', op.relationship, 'data', relatedIdentifier]) === true) {
        return false;
      } else {
        record = clone(record);
      }
    } else {
      record = { type, id };
    }
    if (deepSet(record, ['relationships', op.relationship, 'data', relatedIdentifier], true)) {
      records.set(id, record);
      return true;
    }
  },

  removeFromHasMany(cache: Cache, op: RemoveFromHasManyOperation): boolean {
    const { type, id } = op.record;
    const records = cache.records(type);
    let record = records.get(id);
    if (record) {
      const relatedIdentifier = serializeRecordIdentity(op.relatedRecord);
      if (deepGet(record, ['relationships', op.relationship, 'data', relatedIdentifier])) {
        record = clone(record);
        let data = deepGet(record, ['relationships', op.relationship, 'data']);
        delete data[relatedIdentifier];
        records.set(id, record);
        return true;
      }
    }
    return false;
  },

  replaceHasMany(cache: Cache, op: ReplaceHasManyOperation): boolean {
    const { type, id } = op.record;
    const records = cache.records(type);
    let record = records.get(id);
    if (record) {
      record = clone(record);
    } else {
      record = { type, id };
    }
    let relatedData = {};
    op.relatedRecords.forEach(r => {
      let identifier = serializeRecordIdentity(r);
      relatedData[identifier] = true;
    });
    if (deepSet(record, ['relationships', op.relationship, 'data'], relatedData)) {
      records.set(id, record);
      return true;
    }
  },

  replaceHasOne(cache: Cache, op: ReplaceHasOneOperation): boolean {
    let relatedData;
    if (op.relatedRecord) {
      relatedData = serializeRecordIdentity(op.relatedRecord);
    } else {
      relatedData = null;
    }
    const { type, id } = op.record;
    const records = cache.records(type);
    let record = records.get(id);
    if (record) {
      if (deepGet(record, ['relationships', op.relationship, 'data']) === relatedData) {
        return false;
      } else {
        record = clone(record);
      }
    } else {
      record = { type, id };
    }
    if (deepSet(record, ['relationships', op.relationship, 'data'], relatedData)) {
      records.set(id, record);
      return true;
    }
  }
};
