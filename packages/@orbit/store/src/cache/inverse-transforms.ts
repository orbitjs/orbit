import { deepGet, eq } from '@orbit/utils';
import { 
  serializeRecordIdentity, 
  deserializeRecordIdentity,
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
    return InverseTransforms.addRecord(cache, op);
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

  addToHasMany(cache: Cache, op: AddToHasManyOperation): RecordOperation {
    const { type, id } = op.record;
    const { relationship, relatedRecord } = op;
    const record = cache.records(type).get(id);
    const current = record && deepGet(record, ['relationships', relationship, 'data', serializeRecordIdentity(relatedRecord)]);

    if (current === undefined) {
      return {
        op: 'removeFromHasMany',
        record: { type, id },
        relationship,
        relatedRecord
      };
    }
  },

  removeFromHasMany(cache: Cache, op: RemoveFromHasManyOperation): RecordOperation {
    const { type, id } = op.record;
    const { relationship, relatedRecord } = op;
    const record = cache.records(type).get(id);
    const current = record && deepGet(record, ['relationships', relationship, 'data', serializeRecordIdentity(relatedRecord)]);

    if (current) {
      return {
        op: 'addToHasMany',
        record: { type, id },
        relationship,
        relatedRecord
      };
    }
  },

  replaceHasMany(cache: Cache, op: ReplaceHasManyOperation): RecordOperation {
    const { type, id } = op.record;
    const { relationship } = op;
    const record = cache.records(type).get(id);
    const currentValue = record && deepGet(record, ['relationships', relationship, 'data']);
    let currentRecords;
    if (currentValue) {
      currentRecords = Object.keys(currentValue).map(identifier => deserializeRecordIdentity(identifier));
    } else {
      currentRecords = [];
    }

    if (!eq(currentRecords, op.relatedRecords)) {
      return {
        op: 'replaceHasMany',
        record: { type, id },
        relationship,
        relatedRecords: currentRecords
      };
    }
  },

  replaceHasOne(cache: Cache, op: ReplaceHasOneOperation): RecordOperation {
    const { type, id } = op.record;
    const { relationship } = op;
    const record = cache.records(type).get(id);
    const currentValue = record && deepGet(record, ['relationships', relationship, 'data']);
    const currentRecord = currentValue ? deserializeRecordIdentity(currentValue) : currentValue;

    if (!eq(currentRecord, op.relatedRecord)) {
      return {
        op: 'replaceHasOne',
        record: { type, id },
        relationship: relationship,
        relatedRecord: currentRecord
      };
    }
  }
};

export default InverseTransforms;
