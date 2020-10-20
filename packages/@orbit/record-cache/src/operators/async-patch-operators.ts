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
import { AsyncRecordAccessor } from '../record-accessor';

export interface AsyncPatchOperator {
  (cache: AsyncRecordAccessor, operation: RecordOperation): Promise<
    RecordOperationResult
  >;
}

export const AsyncPatchOperators: Dict<AsyncPatchOperator> = {
  async addRecord(
    cache: AsyncRecordAccessor,
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
    cache: AsyncRecordAccessor,
    operation: RecordOperation
  ): Promise<RecordOperationResult> {
    const op = operation as UpdateRecordOperation;
    const { record } = op;
    const currentRecord = await cache.getRecordAsync(record);
    const mergedRecord = mergeRecords(currentRecord || null, record);

    await cache.setRecordAsync(mergedRecord);

    if (cache.keyMap) {
      cache.keyMap.pushRecord(mergedRecord);
    }

    return mergedRecord;
  },

  async removeRecord(
    cache: AsyncRecordAccessor,
    operation: RecordOperation
  ): Promise<RecordOperationResult> {
    const op = operation as RemoveRecordOperation;
    return await cache.removeRecordAsync(op.record);
  },

  async replaceKey(
    cache: AsyncRecordAccessor,
    operation: RecordOperation
  ): Promise<RecordOperationResult> {
    const op = operation as ReplaceKeyOperation;
    const currentRecord = await cache.getRecordAsync(op.record);
    let record: Record;

    if (currentRecord) {
      record = clone(currentRecord);
    } else {
      record = cloneRecordIdentity(op.record);
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
    operation: RecordOperation
  ): Promise<RecordOperationResult> {
    const op = operation as ReplaceAttributeOperation;
    const currentRecord = await cache.getRecordAsync(op.record);
    let record: Record;

    if (currentRecord) {
      record = clone(currentRecord);
    } else {
      record = cloneRecordIdentity(op.record);
    }

    deepSet(record, ['attributes', op.attribute], op.value);
    await cache.setRecordAsync(record);

    return record;
  },

  async addToRelatedRecords(
    cache: AsyncRecordAccessor,
    operation: RecordOperation
  ): Promise<RecordOperationResult> {
    const op = operation as AddToRelatedRecordsOperation;
    const { relationship, relatedRecord } = op;
    const currentRecord = await cache.getRecordAsync(op.record);
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
      await cache.setRecordAsync(record);
    }

    return record;
  },

  async removeFromRelatedRecords(
    cache: AsyncRecordAccessor,
    operation: RecordOperation
  ): Promise<RecordOperationResult> {
    const op = operation as RemoveFromRelatedRecordsOperation;
    const currentRecord = await cache.getRecordAsync(op.record);
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
          await cache.setRecordAsync(record);
        }
      }
      return record;
    }

    return undefined;
  },

  async replaceRelatedRecords(
    cache: AsyncRecordAccessor,
    operation: RecordOperation
  ): Promise<RecordOperationResult> {
    const op = operation as ReplaceRelatedRecordsOperation;
    const currentRecord = await cache.getRecordAsync(op.record);
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
      await cache.setRecordAsync(record);
    }

    return record;
  },

  async replaceRelatedRecord(
    cache: AsyncRecordAccessor,
    operation: RecordOperation
  ): Promise<RecordOperationResult> {
    const op = operation as ReplaceRelatedRecordOperation;
    const currentRecord = await cache.getRecordAsync(op.record);
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
      await cache.setRecordAsync(record);
    }

    return record;
  }
};
