import { Dict, clone, deepGet, deepSet } from '@orbit/utils';
import {
  cloneRecordIdentity,
  equalRecordIdentities,
  mergeRecords,
  RecordIdentity,
  RecordOperation,
  AddRecordOperation,
  UpdateRecordOperation,
  RemoveRecordOperation,
  ReplaceKeyOperation,
  ReplaceAttributeOperation,
  AddToRelatedRecordsOperation,
  RemoveFromRelatedRecordsOperation,
  ReplaceRelatedRecordsOperation,
  ReplaceRelatedRecordOperation
} from '@orbit/data';
import { SyncRecordAccessor } from '../record-accessor';
import { PatchResultData } from '../patch-result';

export interface SyncPatchOperator {
  (cache: SyncRecordAccessor, op: RecordOperation): PatchResultData;
}

export const SyncPatchOperators: Dict<SyncPatchOperator> = {
  addRecord(cache: SyncRecordAccessor, op: AddRecordOperation): PatchResultData {
    const { record } = op;
    cache.setRecordSync(record);

    if (cache.keyMap) {
      cache.keyMap.pushRecord(record);
    }

    return record;
  },

  updateRecord(cache: SyncRecordAccessor, op: UpdateRecordOperation): PatchResultData {
    const { record } = op;
    const currentRecord = cache.getRecordSync(record);
    const mergedRecord = mergeRecords(currentRecord, record);

    cache.setRecordSync(mergedRecord);

    if (cache.keyMap) {
      cache.keyMap.pushRecord(mergedRecord);
    }

    return mergedRecord;
  },

  removeRecord(cache: SyncRecordAccessor, op: RemoveRecordOperation): PatchResultData {
    return cache.removeRecordSync(op.record);
  },

  replaceKey(cache: SyncRecordAccessor, op: ReplaceKeyOperation): PatchResultData {
    let record = cache.getRecordSync(op.record);

    if (record) {
      record = clone(record);
    } else {
      record = cloneRecordIdentity(op.record);
    }

    deepSet(record, ['keys', op.key], op.value);
    cache.setRecordSync(record);

    if (cache.keyMap) {
      cache.keyMap.pushRecord(record);
    }

    return record;
  },

  replaceAttribute(cache: SyncRecordAccessor, op: ReplaceAttributeOperation): PatchResultData {
    let record = cache.getRecordSync(op.record);

    if (record) {
      record = clone(record);
    } else {
      record = cloneRecordIdentity(op.record);
    }

    deepSet(record, ['attributes', op.attribute], op.value);
    cache.setRecordSync(record);

    return record;
  },

  addToRelatedRecords(cache: SyncRecordAccessor, op: AddToRelatedRecordsOperation): PatchResultData {
    let record = cache.getRecordSync(op.record);
    const { relationship, relatedRecord } = op;

    if (record) {
      record = clone(record);
    } else {
      record = cloneRecordIdentity(op.record);
    }

    const relatedRecords: RecordIdentity[] = deepGet(record, ['relationships', relationship, 'data']) || [];
    relatedRecords.push(relatedRecord);

    deepSet(record, ['relationships', relationship, 'data'], relatedRecords);
    cache.setRecordSync(record);

    return record;
  },

  removeFromRelatedRecords(cache: SyncRecordAccessor, op: RemoveFromRelatedRecordsOperation): PatchResultData {
    let record = cache.getRecordSync(op.record);
    const { relationship, relatedRecord } = op;

    if (record) {
      record = clone(record);
      let relatedRecords: RecordIdentity[] = deepGet(record, ['relationships', relationship, 'data']);
      if (relatedRecords) {
        relatedRecords = relatedRecords.filter(r => !equalRecordIdentities(r, relatedRecord));

        if (deepSet(record, ['relationships', relationship, 'data'], relatedRecords)) {
          cache.setRecordSync(record);
        }
      }
      return record;
    }

    return null;
  },

  replaceRelatedRecords(cache: SyncRecordAccessor, op: ReplaceRelatedRecordsOperation): PatchResultData {
    let record = cache.getRecordSync(op.record);
    const { relationship, relatedRecords } = op;

    if (record) {
      record = clone(record);
    } else {
      record = cloneRecordIdentity(op.record);
    }

    if (deepSet(record, ['relationships', relationship, 'data'], relatedRecords)) {
      cache.setRecordSync(record);
    }

    return record;
  },

  replaceRelatedRecord(cache: SyncRecordAccessor, op: ReplaceRelatedRecordOperation): PatchResultData {
    let record = cache.getRecordSync(op.record);
    const { relationship, relatedRecord } = op;

    if (record) {
      record = clone(record);
    } else {
      record = cloneRecordIdentity(op.record);
    }

    if (deepSet(record, ['relationships', relationship, 'data'], relatedRecord)) {
      cache.setRecordSync(record);
    }

    return record;
  }
};
