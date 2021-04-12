import { RequestOptions } from '@orbit/data';
import {
  AddRecordOperation,
  AddToRelatedRecordsOperation,
  cloneRecordIdentity,
  equalRecordIdentities,
  InitializedRecord,
  mergeRecords,
  RecordIdentity,
  RecordNotFoundException,
  RecordOperation,
  RecordOperationResult,
  recordsInclude,
  RemoveFromRelatedRecordsOperation,
  RemoveRecordOperation,
  ReplaceAttributeOperation,
  ReplaceKeyOperation,
  ReplaceRelatedRecordOperation,
  ReplaceRelatedRecordsOperation,
  UpdateRecordOperation
} from '@orbit/records';
import { clone, deepGet, deepSet, Dict } from '@orbit/utils';
import { SyncRecordAccessor } from '../record-accessor';

export interface SyncTransformOperator {
  (
    cache: SyncRecordAccessor,
    operation: RecordOperation,
    options?: RequestOptions
  ): RecordOperationResult;
}

export const SyncTransformOperators: Dict<SyncTransformOperator> = {
  addRecord(
    cache: SyncRecordAccessor,
    operation: RecordOperation,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    options?: RequestOptions
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
    operation: RecordOperation,
    options?: RequestOptions
  ): RecordOperationResult {
    const op = operation as UpdateRecordOperation;
    const { record } = op;
    const currentRecord = cache.getRecordSync(record);

    if (currentRecord === undefined) {
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
    cache: SyncRecordAccessor,
    operation: RecordOperation,
    options?: RequestOptions
  ): RecordOperationResult {
    const op = operation as RemoveRecordOperation;
    const record = cache.removeRecordSync(op.record);

    if (record === undefined) {
      if (options?.raiseNotFoundExceptions) {
        throw new RecordNotFoundException(op.record.type, op.record.id);
      }
    }

    return record;
  },

  replaceKey(
    cache: SyncRecordAccessor,
    operation: RecordOperation,
    options?: RequestOptions
  ): RecordOperationResult {
    const op = operation as ReplaceKeyOperation;
    const currentRecord = cache.getRecordSync(op.record);
    let record: InitializedRecord;

    if (currentRecord) {
      record = clone(currentRecord);
    } else {
      record = cloneRecordIdentity(op.record);

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
    cache: SyncRecordAccessor,
    operation: RecordOperation,
    options?: RequestOptions
  ): RecordOperationResult {
    const op = operation as ReplaceAttributeOperation;
    const currentRecord = cache.getRecordSync(op.record);
    let record: InitializedRecord;

    if (currentRecord) {
      record = clone(currentRecord);
    } else {
      record = cloneRecordIdentity(op.record);

      if (options?.raiseNotFoundExceptions) {
        throw new RecordNotFoundException(record.type, record.id);
      }
    }

    deepSet(record, ['attributes', op.attribute], op.value);
    cache.setRecordSync(record);

    return record;
  },

  addToRelatedRecords(
    cache: SyncRecordAccessor,
    operation: RecordOperation,
    options?: RequestOptions
  ): RecordOperationResult {
    const op = operation as AddToRelatedRecordsOperation;
    const { relationship, relatedRecord } = op;
    const currentRecord = cache.getRecordSync(op.record);
    let record: InitializedRecord;

    if (currentRecord) {
      record = clone(currentRecord);
    } else {
      record = cloneRecordIdentity(op.record);

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
    cache: SyncRecordAccessor,
    operation: RecordOperation,
    options?: RequestOptions
  ): RecordOperationResult {
    const op = operation as RemoveFromRelatedRecordsOperation;
    const currentRecord = cache.getRecordSync(op.record);
    const { relationship, relatedRecord } = op;
    let record: InitializedRecord;

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
      if (options?.raiseNotFoundExceptions) {
        throw new RecordNotFoundException(op.record.type, op.record.id);
      }
    }
  },

  replaceRelatedRecords(
    cache: SyncRecordAccessor,
    operation: RecordOperation,
    options?: RequestOptions
  ): RecordOperationResult {
    const op = operation as ReplaceRelatedRecordsOperation;
    const currentRecord = cache.getRecordSync(op.record);
    const { relationship, relatedRecords } = op;
    let record: InitializedRecord;

    if (currentRecord) {
      record = clone(currentRecord);
    } else {
      record = cloneRecordIdentity(op.record);

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
    cache: SyncRecordAccessor,
    operation: RecordOperation,
    options?: RequestOptions
  ): RecordOperationResult {
    const op = operation as ReplaceRelatedRecordOperation;
    const currentRecord = cache.getRecordSync(op.record);
    const { relationship, relatedRecord } = op;
    let record: InitializedRecord;

    if (currentRecord) {
      record = clone(currentRecord);
    } else {
      record = cloneRecordIdentity(op.record);

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
