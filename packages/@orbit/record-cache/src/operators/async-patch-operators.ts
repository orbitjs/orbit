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
import { AsyncRecordAccessor } from '../record-accessor';
import { PatchResultData } from '../patch-result';

export interface AsyncPatchOperator {
  (cache: AsyncRecordAccessor, op: RecordOperation): Promise<PatchResultData>;
}

export const AsyncPatchOperators: Dict<AsyncPatchOperator> = {
  async addRecord(
    cache: AsyncRecordAccessor,
    op: AddRecordOperation
  ): Promise<PatchResultData> {
    const { record } = op;
    await cache.setRecordAsync(record);

    if (cache.keyMap) {
      cache.keyMap.pushRecord(record);
    }

    return record;
  },

  async updateRecord(
    cache: AsyncRecordAccessor,
    op: UpdateRecordOperation
  ): Promise<PatchResultData> {
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
    op: RemoveRecordOperation
  ): Promise<PatchResultData> {
    return await cache.removeRecordAsync(op.record);
  },

  async replaceKey(
    cache: AsyncRecordAccessor,
    op: ReplaceKeyOperation
  ): Promise<PatchResultData> {
    let currentRecord = await cache.getRecordAsync(op.record);
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
    op: ReplaceAttributeOperation
  ): Promise<PatchResultData> {
    let currentRecord = await cache.getRecordAsync(op.record);
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
    op: AddToRelatedRecordsOperation
  ): Promise<PatchResultData> {
    let currentRecord = await cache.getRecordAsync(op.record);
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
      await cache.setRecordAsync(record);
    }

    return record;
  },

  async removeFromRelatedRecords(
    cache: AsyncRecordAccessor,
    op: RemoveFromRelatedRecordsOperation
  ): Promise<PatchResultData> {
    let currentRecord = await cache.getRecordAsync(op.record);
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

    return null;
  },

  async replaceRelatedRecords(
    cache: AsyncRecordAccessor,
    op: ReplaceRelatedRecordsOperation
  ): Promise<PatchResultData> {
    let currentRecord = await cache.getRecordAsync(op.record);
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
      await cache.setRecordAsync(record);
    }

    return record;
  },

  async replaceRelatedRecord(
    cache: AsyncRecordAccessor,
    op: ReplaceRelatedRecordOperation
  ): Promise<PatchResultData> {
    let currentRecord = await cache.getRecordAsync(op.record);
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
      await cache.setRecordAsync(record);
    }

    return record;
  }
};
