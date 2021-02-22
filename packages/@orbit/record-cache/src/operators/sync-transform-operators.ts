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
  recordsInclude,
  RecordTransform,
  RecordNotFoundException
} from '@orbit/records';
import { SyncRecordCache } from '../sync-record-cache';

export interface SyncTransformOperator {
  (
    cache: SyncRecordCache,
    transform: RecordTransform,
    operation: RecordOperation
  ): RecordOperationResult;
}

export const SyncTransformOperators: Dict<SyncTransformOperator> = {
  addRecord(
    cache: SyncRecordCache,
    transform: RecordTransform,
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
    cache: SyncRecordCache,
    transform: RecordTransform,
    operation: RecordOperation
  ): RecordOperationResult {
    const op = operation as UpdateRecordOperation;
    const { record } = op;
    const currentRecord = cache.getRecordSync(record);

    if (currentRecord === undefined) {
      const options = cache.getTransformOptions(transform, operation);
      if (options?.raiseNotFoundExceptions) {
        throw new RecordNotFoundException(record.type, record.id);
      }
    }

    const mergedRecord = mergeRecords(currentRecord || null, record);

    cache.setRecordSync(mergedRecord);

    if (cache.keyMap) {
      cache.keyMap.pushRecord(mergedRecord);
    }

    return mergedRecord;
  },

  removeRecord(
    cache: SyncRecordCache,
    transform: RecordTransform,
    operation: RecordOperation
  ): RecordOperationResult {
    const op = operation as RemoveRecordOperation;
    const record = cache.removeRecordSync(op.record);

    if (record === undefined) {
      const options = cache.getTransformOptions(transform, operation);
      if (options?.raiseNotFoundExceptions) {
        throw new RecordNotFoundException(op.record.type, op.record.id);
      }
    }

    return record;
  },

  replaceKey(
    cache: SyncRecordCache,
    transform: RecordTransform,
    operation: RecordOperation
  ): RecordOperationResult {
    const op = operation as ReplaceKeyOperation;
    const currentRecord = cache.getRecordSync(op.record);
    let record: Record;

    if (currentRecord) {
      record = clone(currentRecord);
    } else {
      record = cloneRecordIdentity(op.record);

      const options = cache.getTransformOptions(transform, operation);
      if (options?.raiseNotFoundExceptions) {
        throw new RecordNotFoundException(record.type, record.id);
      }
    }

    deepSet(record, ['keys', op.key], op.value);
    cache.setRecordSync(record);

    if (cache.keyMap) {
      cache.keyMap.pushRecord(record);
    }

    return record;
  },

  replaceAttribute(
    cache: SyncRecordCache,
    transform: RecordTransform,
    operation: RecordOperation
  ): RecordOperationResult {
    const op = operation as ReplaceAttributeOperation;
    const currentRecord = cache.getRecordSync(op.record);
    let record: Record;

    if (currentRecord) {
      record = clone(currentRecord);
    } else {
      record = cloneRecordIdentity(op.record);

      const options = cache.getTransformOptions(transform, operation);
      if (options?.raiseNotFoundExceptions) {
        throw new RecordNotFoundException(record.type, record.id);
      }
    }

    deepSet(record, ['attributes', op.attribute], op.value);
    cache.setRecordSync(record);

    return record;
  },

  addToRelatedRecords(
    cache: SyncRecordCache,
    transform: RecordTransform,
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

      const options = cache.getTransformOptions(transform, operation);
      if (options?.raiseNotFoundExceptions) {
        throw new RecordNotFoundException(record.type, record.id);
      }
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
    cache: SyncRecordCache,
    transform: RecordTransform,
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
    } else {
      const options = cache.getTransformOptions(transform, operation);
      if (options?.raiseNotFoundExceptions) {
        throw new RecordNotFoundException(op.record.type, op.record.id);
      }
    }
  },

  replaceRelatedRecords(
    cache: SyncRecordCache,
    transform: RecordTransform,
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

      const options = cache.getTransformOptions(transform, operation);
      if (options?.raiseNotFoundExceptions) {
        throw new RecordNotFoundException(record.type, record.id);
      }
    }

    if (
      deepSet(record, ['relationships', relationship, 'data'], relatedRecords)
    ) {
      cache.setRecordSync(record);
    }

    return record;
  },

  replaceRelatedRecord(
    cache: SyncRecordCache,
    transform: RecordTransform,
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

      const options = cache.getTransformOptions(transform, operation);
      if (options?.raiseNotFoundExceptions) {
        throw new RecordNotFoundException(record.type, record.id);
      }
    }

    if (
      deepSet(record, ['relationships', relationship, 'data'], relatedRecord)
    ) {
      cache.setRecordSync(record);
    }

    return record;
  }
};
