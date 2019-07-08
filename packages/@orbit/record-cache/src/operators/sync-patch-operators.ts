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
  ReplaceRelatedRecordOperation,
  Record,
  recordsInclude
} from '@orbit/data';
import { SyncRecordAccessor } from '../record-accessor';
import { PatchResultData } from '../patch-result';

export interface SyncPatchOperator {
  (cache: SyncRecordAccessor, op: RecordOperation): PatchResultData;
}

export const SyncPatchOperators: Dict<SyncPatchOperator> = {
  addRecord(
    cache: SyncRecordAccessor,
    op: AddRecordOperation
  ): PatchResultData {
    const { record } = op;
    cache.setRecordSync(record);

    if (cache.keyMap) {
      cache.keyMap.pushRecord(record);
    }

    return record;
  },

  updateRecord(
    cache: SyncRecordAccessor,
    op: UpdateRecordOperation
  ): PatchResultData {
    const { record } = op;
    const currentRecord = cache.getRecordSync(record);
    const mergedRecord = mergeRecords(currentRecord || null, record);

    cache.setRecordSync(mergedRecord);

    if (cache.keyMap) {
      cache.keyMap.pushRecord(mergedRecord);
    }

    return mergedRecord;
  },

  removeRecord(
    cache: SyncRecordAccessor,
    op: RemoveRecordOperation
  ): PatchResultData {
    return cache.removeRecordSync(op.record);
  },

  replaceKey(
    cache: SyncRecordAccessor,
    op: ReplaceKeyOperation
  ): PatchResultData {
    let currentRecord = cache.getRecordSync(op.record);
    let record: Record;

    if (currentRecord) {
      record = clone(currentRecord);
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

  replaceAttribute(
    cache: SyncRecordAccessor,
    op: ReplaceAttributeOperation
  ): PatchResultData {
    let currentRecord = cache.getRecordSync(op.record);
    let record: Record;

    if (currentRecord) {
      record = clone(currentRecord);
    } else {
      record = cloneRecordIdentity(op.record);
    }

    deepSet(record, ['attributes', op.attribute], op.value);
    cache.setRecordSync(record);

    return record;
  },

  addToRelatedRecords(
    cache: SyncRecordAccessor,
    op: AddToRelatedRecordsOperation
  ): PatchResultData {
    let currentRecord = cache.getRecordSync(op.record);
    let record: Record;
    const { relationship, relatedRecord } = op;

    if (currentRecord) {
      record = clone(currentRecord);
    } else {
      record = cloneRecordIdentity(op.record);
    }

    const relatedRecords: RecordIdentity[] =
      deepGet(record, ['relationships', relationship, 'data']) || [];

    if (!recordsInclude(relatedRecords, relatedRecord)) {
      relatedRecords.push(relatedRecord);

      deepSet(record, ['relationships', relationship, 'data'], relatedRecords);
      cache.setRecordSync(record);
    }

    return record;
  },

  removeFromRelatedRecords(
    cache: SyncRecordAccessor,
    op: RemoveFromRelatedRecordsOperation
  ): PatchResultData {
    let currentRecord = cache.getRecordSync(op.record);
    let record: Record;
    const { relationship, relatedRecord } = op;

    if (currentRecord) {
      record = clone(currentRecord);
      let relatedRecords: RecordIdentity[] = deepGet(record, [
        'relationships',
        relationship,
        'data'
      ]);
      if (relatedRecords) {
        relatedRecords = relatedRecords.filter(
          r => !equalRecordIdentities(r, relatedRecord)
        );

        if (
          deepSet(
            record,
            ['relationships', relationship, 'data'],
            relatedRecords
          )
        ) {
          cache.setRecordSync(record);
        }
      }
      return record;
    }

    return null;
  },

  replaceRelatedRecords(
    cache: SyncRecordAccessor,
    op: ReplaceRelatedRecordsOperation
  ): PatchResultData {
    let currentRecord = cache.getRecordSync(op.record);
    let record: Record;
    const { relationship, relatedRecords } = op;

    if (currentRecord) {
      record = clone(currentRecord);
    } else {
      record = cloneRecordIdentity(op.record);
    }

    if (
      deepSet(record, ['relationships', relationship, 'data'], relatedRecords)
    ) {
      cache.setRecordSync(record);
    }

    return record;
  },

  replaceRelatedRecord(
    cache: SyncRecordAccessor,
    op: ReplaceRelatedRecordOperation
  ): PatchResultData {
    let currentRecord = cache.getRecordSync(op.record);
    let record: Record;
    const { relationship, relatedRecord } = op;

    if (currentRecord) {
      record = clone(currentRecord);
    } else {
      record = cloneRecordIdentity(op.record);
    }

    if (
      deepSet(record, ['relationships', relationship, 'data'], relatedRecord)
    ) {
      cache.setRecordSync(record);
    }

    return record;
  }
};
