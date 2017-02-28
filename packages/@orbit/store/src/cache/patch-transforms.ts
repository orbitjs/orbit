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
} from '@orbit/core';
import { clone, get, set } from '@orbit/utils';
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
    const { type, id } = op.record;
    const records = cache.records(type);
    if (records.get(id) !== op.record) {
      records.set(id, op.record);
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
      if (get(record, ['keys', op.key]) === op.value) {
        return false;
      } else {
        record = clone(record);
      }
    } else {
      record = { type, id };
    }
    if (set(record, ['keys', op.key], op.value)) {
      records.set(id, record);
      return true;
    }
  },

  replaceAttribute(cache: Cache, op: ReplaceAttributeOperation): boolean {
    const { type, id } = op.record;
    const records = cache.records(type);
    let record = records.get(id);
    if (record) {
      if (get(record, ['attributes', op.attribute]) === op.value) {
        return false;
      } else {
        record = clone(record);
      }
    } else {
      record = { type, id };
    }
    if (set(record, ['attributes', op.attribute], op.value)) {
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
      if (get(record, ['relationships', op.relationship, 'data', relatedIdentifier]) === true) {
        return false;
      } else {
        record = clone(record);
      }
    } else {
      record = { type, id };
    }
    if (set(record, ['relationships', op.relationship, 'data', relatedIdentifier], true)) {
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
      if (get(record, ['relationships', op.relationship, 'data', relatedIdentifier])) {
        record = clone(record);
        let data = get(record, ['relationships', op.relationship, 'data']);
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
    if (set(record, ['relationships', op.relationship, 'data'], relatedData)) {
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
      if (get(record, ['relationships', op.relationship, 'data']) === relatedData) {
        return false;
      } else {
        record = clone(record);
      }
    } else {
      record = { type, id };
    }
    if (set(record, ['relationships', op.relationship, 'data'], relatedData)) {
      records.set(id, record);
      return true;
    }
  }
};
