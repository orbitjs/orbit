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
import { AsyncRecordAccessor } from '../record-accessor';

export interface AsyncTransformOperator {
  (
    cache: AsyncRecordAccessor,
    operation: RecordOperation,
    options?: RequestOptions
  ): Promise<RecordOperationResult>;
}

export const AsyncTransformOperators: Dict<AsyncTransformOperator> = {
  async addRecord(
    cache: AsyncRecordAccessor,
    operation: RecordOperation,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    options?: RequestOptions
  ): Promise<RecordOperationResult> {
    const op = operation as AddRecordOperation;
    const { record } = op;
    await cache.setRecordAsync(record);

    if (cache.keyMap) {
      cache.keyMap.pushRecord(record);
    }

    return record;
  },

  async updateRecord(
    cache: AsyncRecordAccessor,
    operation: RecordOperation,
    options?: RequestOptions
  ): Promise<RecordOperationResult> {
    const op = operation as UpdateRecordOperation;
    const { record } = op;
    const currentRecord = await cache.getRecordAsync(record);

    if (currentRecord === undefined) {
      if (options?.raiseNotFoundExceptions) {
        throw new RecordNotFoundException(record.type, record.id);
      }
    }

    const mergedRecord = mergeRecords(currentRecord || null, record);

    await cache.setRecordAsync(mergedRecord);

    if (cache.keyMap) {
      cache.keyMap.pushRecord(mergedRecord);
    }

    return mergedRecord;
  },

  async removeRecord(
    cache: AsyncRecordAccessor,
    operation: RecordOperation,
    options?: RequestOptions
  ): Promise<RecordOperationResult> {
    const op = operation as RemoveRecordOperation;
    const record = await cache.removeRecordAsync(op.record);

    if (record === undefined) {
      if (options?.raiseNotFoundExceptions) {
        throw new RecordNotFoundException(op.record.type, op.record.id);
      }
    }

    return record;
  },

  async replaceKey(
    cache: AsyncRecordAccessor,
    operation: RecordOperation,
    options?: RequestOptions
  ): Promise<RecordOperationResult> {
    const op = operation as ReplaceKeyOperation;
    const currentRecord = await cache.getRecordAsync(op.record);
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
    await cache.setRecordAsync(record);

    if (cache.keyMap) {
      cache.keyMap.pushRecord(record);
    }

    return record;
  },

  async replaceAttribute(
    cache: AsyncRecordAccessor,
    operation: RecordOperation,
    options?: RequestOptions
  ): Promise<RecordOperationResult> {
    const op = operation as ReplaceAttributeOperation;
    const currentRecord = await cache.getRecordAsync(op.record);
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
    await cache.setRecordAsync(record);

    return record;
  },

  async addToRelatedRecords(
    cache: AsyncRecordAccessor,
    operation: RecordOperation,
    options?: RequestOptions
  ): Promise<RecordOperationResult> {
    const op = operation as AddToRelatedRecordsOperation;
    const { relationship, relatedRecord } = op;
    const currentRecord = await cache.getRecordAsync(op.record);
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
      await cache.setRecordAsync(record);
    }

    return record;
  },

  async removeFromRelatedRecords(
    cache: AsyncRecordAccessor,
    operation: RecordOperation,
    options?: RequestOptions
  ): Promise<RecordOperationResult> {
    const op = operation as RemoveFromRelatedRecordsOperation;
    const currentRecord = await cache.getRecordAsync(op.record);
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
          await cache.setRecordAsync(record);
        }
      }
      return record;
    } else {
      if (options?.raiseNotFoundExceptions) {
        throw new RecordNotFoundException(op.record.type, op.record.id);
      }
    }
  },

  async replaceRelatedRecords(
    cache: AsyncRecordAccessor,
    operation: RecordOperation,
    options?: RequestOptions
  ): Promise<RecordOperationResult> {
    const op = operation as ReplaceRelatedRecordsOperation;
    const currentRecord = await cache.getRecordAsync(op.record);
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
      await cache.setRecordAsync(record);
    }

    return record;
  },

  async replaceRelatedRecord(
    cache: AsyncRecordAccessor,
    operation: RecordOperation,
    options?: RequestOptions
  ): Promise<RecordOperationResult> {
    const op = operation as ReplaceRelatedRecordOperation;
    const currentRecord = await cache.getRecordAsync(op.record);
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
      await cache.setRecordAsync(record);
    }

    return record;
  }
};
