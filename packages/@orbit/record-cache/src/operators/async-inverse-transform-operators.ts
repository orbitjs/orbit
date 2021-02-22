import { Dict, deepGet, deepSet, eq } from '@orbit/utils';
import {
  Record,
  RecordOperation,
  AddRecordOperation,
  AddToRelatedRecordsOperation,
  ReplaceAttributeOperation,
  RemoveFromRelatedRecordsOperation,
  RemoveRecordOperation,
  ReplaceRelatedRecordsOperation,
  ReplaceRelatedRecordOperation,
  ReplaceKeyOperation,
  UpdateRecordOperation,
  equalRecordIdentities,
  equalRecordIdentitySets,
  recordsInclude,
  RecordIdentity,
  RecordTransform,
  RecordNotFoundException
} from '@orbit/records';
import { AsyncRecordCache } from '../async-record-cache';

export interface AsyncInverseTransformOperator {
  (
    cache: AsyncRecordCache,
    transform: RecordTransform,
    operation: RecordOperation
  ): Promise<RecordOperation | undefined>;
}

export const AsyncInverseTransformOperators: Dict<AsyncInverseTransformOperator> = {
  async addRecord(
    cache: AsyncRecordCache,
    transform: RecordTransform,
    operation: RecordOperation
  ): Promise<RecordOperation | undefined> {
    const op = operation as AddRecordOperation;
    const { type, id } = op.record;
    const current = await cache.getRecordAsync(op.record);

    if (current) {
      if (eq(current, op.record)) {
        return;
      } else {
        return {
          op: 'updateRecord',
          record: current
        };
      }
    } else {
      return {
        op: 'removeRecord',
        record: { type, id }
      };
    }
  },

  async updateRecord(
    cache: AsyncRecordCache,
    transform: RecordTransform,
    operation: RecordOperation
  ): Promise<RecordOperation | undefined> {
    const op = operation as UpdateRecordOperation;
    const currentRecord = await cache.getRecordAsync(op.record);
    const replacement: Record = op.record;
    const { type, id } = replacement;

    if (currentRecord) {
      let result = { type, id };
      let changed = false;

      ['attributes', 'keys'].forEach((grouping) => {
        if ((replacement as any)[grouping]) {
          Object.keys((replacement as any)[grouping]).forEach((field) => {
            let value = (replacement as any)[grouping][field];
            let currentValue = deepGet(currentRecord, [grouping, field]);
            if (!eq(value, currentValue)) {
              changed = true;
              deepSet(
                result,
                [grouping, field],
                currentValue === undefined ? null : currentValue
              );
            }
          });
        }
      });

      if (replacement.relationships) {
        Object.keys(replacement.relationships).forEach((field) => {
          let data = deepGet(replacement, ['relationships', field, 'data']);
          if (data !== undefined) {
            let currentData = deepGet(currentRecord, [
              'relationships',
              field,
              'data'
            ]);
            let relationshipChanged;

            if (Array.isArray(data)) {
              if (currentData) {
                relationshipChanged = !equalRecordIdentitySets(
                  currentData,
                  data
                );
              } else {
                relationshipChanged = true;
                currentData = [];
              }
            } else {
              if (currentData) {
                relationshipChanged = !equalRecordIdentities(currentData, data);
              } else {
                relationshipChanged = true;
                currentData = null;
              }
            }

            if (relationshipChanged) {
              changed = true;
              deepSet(result, ['relationships', field, 'data'], currentData);
            }
          }
        });
      }

      if (changed) {
        return {
          op: 'updateRecord',
          record: result
        };
      }
    } else {
      const options = cache.getTransformOptions(transform, operation);
      if (options?.raiseNotFoundExceptions) {
        throw new RecordNotFoundException(type, id);
      } else {
        return {
          op: 'removeRecord',
          record: { type, id }
        };
      }
    }
  },

  async removeRecord(
    cache: AsyncRecordCache,
    transform: RecordTransform,
    operation: RecordOperation
  ): Promise<RecordOperation | undefined> {
    const op = operation as RemoveRecordOperation;
    const { record } = op;
    const currentRecord = await cache.getRecordAsync(record);

    if (currentRecord) {
      return {
        op: 'addRecord',
        record: currentRecord
      };
    } else {
      const options = cache.getTransformOptions(transform, operation);
      if (options?.raiseNotFoundExceptions) {
        throw new RecordNotFoundException(record.type, record.id);
      }
    }
  },

  async replaceKey(
    cache: AsyncRecordCache,
    transform: RecordTransform,
    operation: RecordOperation
  ): Promise<RecordOperation | undefined> {
    const op = operation as ReplaceKeyOperation;
    const { record, key } = op;
    const currentRecord = await cache.getRecordAsync(record);

    if (currentRecord === undefined) {
      const options = cache.getTransformOptions(transform, operation);
      if (options?.raiseNotFoundExceptions) {
        throw new RecordNotFoundException(record.type, record.id);
      }
    }

    const currentValue = currentRecord && deepGet(currentRecord, ['keys', key]);

    if (!eq(currentValue, op.value)) {
      const { type, id } = op.record;

      return {
        op: 'replaceKey',
        record: { type, id },
        key,
        value: currentValue
      };
    }
  },

  async replaceAttribute(
    cache: AsyncRecordCache,
    transform: RecordTransform,
    operation: RecordOperation
  ): Promise<RecordOperation | undefined> {
    const op = operation as ReplaceAttributeOperation;
    const { record, attribute } = op;
    const currentRecord = await cache.getRecordAsync(record);

    if (currentRecord === undefined) {
      const options = cache.getTransformOptions(transform, operation);
      if (options?.raiseNotFoundExceptions) {
        throw new RecordNotFoundException(record.type, record.id);
      }
    }

    const currentValue =
      currentRecord && deepGet(currentRecord, ['attributes', attribute]);

    if (!eq(currentValue, op.value)) {
      const { type, id } = record;

      return {
        op: 'replaceAttribute',
        record: { type, id },
        attribute,
        value: currentValue
      };
    }
  },

  async addToRelatedRecords(
    cache: AsyncRecordCache,
    transform: RecordTransform,
    operation: RecordOperation
  ): Promise<RecordOperation | undefined> {
    const op = operation as AddToRelatedRecordsOperation;
    const { record, relationship, relatedRecord } = op;
    const currentRelatedRecords = await cache.getRelatedRecordsAsync(
      record,
      relationship
    );

    if (currentRelatedRecords === undefined) {
      const options = cache.getTransformOptions(transform, operation);
      if (options?.raiseNotFoundExceptions) {
        if ((await cache.getRecordAsync(record)) === undefined) {
          throw new RecordNotFoundException(record.type, record.id);
        }
      }
    }

    if (
      currentRelatedRecords === undefined ||
      !recordsInclude(currentRelatedRecords, relatedRecord)
    ) {
      return {
        op: 'removeFromRelatedRecords',
        record,
        relationship,
        relatedRecord
      };
    }
  },

  async removeFromRelatedRecords(
    cache: AsyncRecordCache,
    transform: RecordTransform,
    operation: RecordOperation
  ): Promise<RecordOperation | undefined> {
    const op = operation as RemoveFromRelatedRecordsOperation;
    const { record, relationship, relatedRecord } = op;
    const currentRelatedRecords = await cache.getRelatedRecordsAsync(
      record,
      relationship
    );

    if (currentRelatedRecords === undefined) {
      const options = cache.getTransformOptions(transform, operation);
      if (options?.raiseNotFoundExceptions) {
        if ((await cache.getRecordAsync(record)) === undefined) {
          throw new RecordNotFoundException(record.type, record.id);
        }
      }
    }

    if (
      currentRelatedRecords !== undefined &&
      recordsInclude(currentRelatedRecords, relatedRecord)
    ) {
      return {
        op: 'addToRelatedRecords',
        record,
        relationship,
        relatedRecord
      };
    }
  },

  async replaceRelatedRecords(
    cache: AsyncRecordCache,
    transform: RecordTransform,
    operation: RecordOperation
  ): Promise<RecordOperation | undefined> {
    const op = operation as ReplaceRelatedRecordsOperation;
    const { record, relationship, relatedRecords } = op;
    const currentRelatedRecords = await cache.getRelatedRecordsAsync(
      record,
      relationship
    );

    if (currentRelatedRecords === undefined) {
      const options = cache.getTransformOptions(transform, operation);
      if (options?.raiseNotFoundExceptions) {
        if ((await cache.getRecordAsync(record)) === undefined) {
          throw new RecordNotFoundException(record.type, record.id);
        }
      }
    }

    if (
      currentRelatedRecords === undefined ||
      !equalRecordIdentitySets(currentRelatedRecords, relatedRecords)
    ) {
      return {
        op: 'replaceRelatedRecords',
        record,
        relationship,
        relatedRecords: currentRelatedRecords || []
      };
    }
  },

  async replaceRelatedRecord(
    cache: AsyncRecordCache,
    transform: RecordTransform,
    operation: RecordOperation
  ): Promise<RecordOperation | undefined> {
    const op = operation as ReplaceRelatedRecordOperation;
    const { record, relationship, relatedRecord } = op;
    const currentRelatedRecord = await cache.getRelatedRecordAsync(
      record,
      relationship
    );

    if (currentRelatedRecord === undefined) {
      const options = cache.getTransformOptions(transform, operation);
      if (options?.raiseNotFoundExceptions) {
        if ((await cache.getRecordAsync(record)) === undefined) {
          throw new RecordNotFoundException(record.type, record.id);
        }
      }
    }

    if (
      currentRelatedRecord === undefined ||
      !equalRecordIdentities(
        currentRelatedRecord as RecordIdentity,
        relatedRecord as RecordIdentity
      )
    ) {
      return {
        op: 'replaceRelatedRecord',
        record,
        relationship,
        relatedRecord: currentRelatedRecord || null
      };
    }
  }
};
