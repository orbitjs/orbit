import { Dict, clone, deepGet, deepSet } from '@orbit/utils';
import {
  cloneRecordIdentity,
  equalRecordIdentities,
  mergeRecords,
  RecordIdentity,
  RecordOperation,
  RecordOperationResult,
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

export interface SyncPatchOperator {
  (
    cache: SyncRecordAccessor,
    operation: RecordOperation
  ): RecordOperationResult;
}

export const SyncPatchOperators: Dict<SyncPatchOperator> = {
  addRecord(
    cache: SyncRecordAccessor,
    operation: RecordOperation
  ): RecordOperationResult {
    const op = operation as AddRecordOperation;
    const { record } = op;
    cache.setRecordSync(record);

    if (cache.keyMap) {
      cache.keyMap.pushRecord(record);
    }

    return record;
  },

  updateRecord(
    cache: SyncRecordAccessor,
    operation: RecordOperation
  ): RecordOperationResult {
    const op = operation as UpdateRecordOperation;
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
    operation: RecordOperation
  ): RecordOperationResult {
    const op = operation as RemoveRecordOperation;
    return cache.removeRecordSync(op.record);
  },

  replaceKey(
    cache: SyncRecordAccessor,
    operation: RecordOperation
  ): RecordOperationResult {
    const op = operation as ReplaceKeyOperation;
    const currentRecord = cache.getRecordSync(op.record);
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
    operation: RecordOperation
  ): RecordOperationResult {
    const op = operation as ReplaceAttributeOperation;
    const currentRecord = cache.getRecordSync(op.record);
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
    operation: RecordOperation
  ): RecordOperationResult {
    const op = operation as AddToRelatedRecordsOperation;
    const { relationship, relatedRecord } = op;
    const currentRecord = cache.getRecordSync(op.record);
    let record: Record;

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
    operation: RecordOperation
  ): RecordOperationResult {
    const op = operation as RemoveFromRelatedRecordsOperation;
    const currentRecord = cache.getRecordSync(op.record);
    const { relationship, relatedRecord } = op;
    let record: Record;

    if (currentRecord) {
      record = clone(currentRecord);
      let relatedRecords: RecordIdentity[] = deepGet(record, [
        'relationships',
        relationship,
        'data'
      ]);
      if (relatedRecords) {
        relatedRecords = relatedRecords.filter(
          (r) => !equalRecordIdentities(r, relatedRecord)
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
  },

  replaceRelatedRecords(
    cache: SyncRecordAccessor,
    operation: RecordOperation
  ): RecordOperationResult {
    const op = operation as ReplaceRelatedRecordsOperation;
    const currentRecord = cache.getRecordSync(op.record);
    const { relationship, relatedRecords } = op;
    let record: Record;

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
    operation: RecordOperation
  ): RecordOperationResult {
    const op = operation as ReplaceRelatedRecordOperation;
    const currentRecord = cache.getRecordSync(op.record);
    const { relationship, relatedRecord } = op;
    let record: Record;

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
