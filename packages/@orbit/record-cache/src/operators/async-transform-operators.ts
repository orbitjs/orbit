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
  InitializedRecord,
  recordsInclude,
  RecordTransform,
  RecordNotFoundException
} from '@orbit/records';
import { AsyncRecordCache } from '../async-record-cache';

export interface AsyncTransformOperator {
  (
    cache: AsyncRecordCache,
    transform: RecordTransform,
    operation: RecordOperation
  ): Promise<RecordOperationResult>;
}

export const AsyncTransformOperators: Dict<AsyncTransformOperator> = {
  async addRecord(
    cache: AsyncRecordCache,
    transform: RecordTransform,
    operation: RecordOperation
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
    cache: AsyncRecordCache,
    transform: RecordTransform,
    operation: RecordOperation
  ): Promise<RecordOperationResult> {
    const op = operation as UpdateRecordOperation;
    const { record } = op;
    const currentRecord = await cache.getRecordAsync(record);

    if (currentRecord === undefined) {
      const options = cache.getTransformOptions(transform, operation);
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
    cache: AsyncRecordCache,
    transform: RecordTransform,
    operation: RecordOperation
  ): Promise<RecordOperationResult> {
    const op = operation as RemoveRecordOperation;
    const record = await cache.removeRecordAsync(op.record);

    if (record === undefined) {
      const options = cache.getTransformOptions(transform, operation);
      if (options?.raiseNotFoundExceptions) {
        throw new RecordNotFoundException(op.record.type, op.record.id);
      }
    }

    return record;
  },

  async replaceKey(
    cache: AsyncRecordCache,
    transform: RecordTransform,
    operation: RecordOperation
  ): Promise<RecordOperationResult> {
    const op = operation as ReplaceKeyOperation;
    const currentRecord = await cache.getRecordAsync(op.record);
    let record: InitializedRecord;

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
    await cache.setRecordAsync(record);

    if (cache.keyMap) {
      cache.keyMap.pushRecord(record);
    }

    return record;
  },

  async replaceAttribute(
    cache: AsyncRecordCache,
    transform: RecordTransform,
    operation: RecordOperation
  ): Promise<RecordOperationResult> {
    const op = operation as ReplaceAttributeOperation;
    const currentRecord = await cache.getRecordAsync(op.record);
    let record: InitializedRecord;

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
    await cache.setRecordAsync(record);

    return record;
  },

  async addToRelatedRecords(
    cache: AsyncRecordCache,
    transform: RecordTransform,
    operation: RecordOperation
  ): Promise<RecordOperationResult> {
    const op = operation as AddToRelatedRecordsOperation;
    const { relationship, relatedRecord } = op;
    const currentRecord = await cache.getRecordAsync(op.record);
    let record: InitializedRecord;

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
      await cache.setRecordAsync(record);
    }

    return record;
  },

  async removeFromRelatedRecords(
    cache: AsyncRecordCache,
    transform: RecordTransform,
    operation: RecordOperation
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
      const options = cache.getTransformOptions(transform, operation);
      if (options?.raiseNotFoundExceptions) {
        throw new RecordNotFoundException(op.record.type, op.record.id);
      }
    }
  },

  async replaceRelatedRecords(
    cache: AsyncRecordCache,
    transform: RecordTransform,
    operation: RecordOperation
  ): Promise<RecordOperationResult> {
    const op = operation as ReplaceRelatedRecordsOperation;
    const currentRecord = await cache.getRecordAsync(op.record);
    const { relationship, relatedRecords } = op;
    let record: InitializedRecord;

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
      await cache.setRecordAsync(record);
    }

    return record;
  },

  async replaceRelatedRecord(
    cache: AsyncRecordCache,
    transform: RecordTransform,
    operation: RecordOperation
  ): Promise<RecordOperationResult> {
    const op = operation as ReplaceRelatedRecordOperation;
    const currentRecord = await cache.getRecordAsync(op.record);
    const { relationship, relatedRecord } = op;
    let record: InitializedRecord;

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
      await cache.setRecordAsync(record);
    }

    return record;
  }
};
