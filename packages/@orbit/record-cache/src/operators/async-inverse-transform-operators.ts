import { RequestOptions } from '@orbit/data';
import {
  AddRecordOperation,
  AddToRelatedRecordsOperation,
  equalRecordIdentities,
  equalRecordIdentitySets,
  InitializedRecord,
  RecordIdentity,
  RecordNotFoundException,
  RecordOperation,
  recordsInclude,
  RemoveFromRelatedRecordsOperation,
  RemoveRecordOperation,
  ReplaceAttributeOperation,
  ReplaceKeyOperation,
  ReplaceRelatedRecordOperation,
  ReplaceRelatedRecordsOperation,
  UpdateRecordOperation
} from '@orbit/records';
import { deepGet, deepSet, Dict, eq } from '@orbit/utils';
import { AsyncRecordAccessor } from '../record-accessor';

export interface AsyncInverseTransformOperator {
  (
    cache: AsyncRecordAccessor,
    operation: RecordOperation,
    options?: RequestOptions
  ): Promise<RecordOperation | undefined>;
}

export const AsyncInverseTransformOperators: Dict<AsyncInverseTransformOperator> = {
  async addRecord(
    cache: AsyncRecordAccessor,
    operation: RecordOperation,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    options?: RequestOptions
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
    cache: AsyncRecordAccessor,
    operation: RecordOperation,
    options?: RequestOptions
  ): Promise<RecordOperation | undefined> {
    const op = operation as UpdateRecordOperation;
    const currentRecord = await cache.getRecordAsync(op.record);
    const replacement: InitializedRecord = op.record;
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
    cache: AsyncRecordAccessor,
    operation: RecordOperation,
    options?: RequestOptions
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
      if (options?.raiseNotFoundExceptions) {
        throw new RecordNotFoundException(record.type, record.id);
      }
    }
  },

  async replaceKey(
    cache: AsyncRecordAccessor,
    operation: RecordOperation,
    options?: RequestOptions
  ): Promise<RecordOperation | undefined> {
    const op = operation as ReplaceKeyOperation;
    const { record, key } = op;
    const currentRecord = await cache.getRecordAsync(record);

    if (currentRecord === undefined) {
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
    cache: AsyncRecordAccessor,
    operation: RecordOperation,
    options?: RequestOptions
  ): Promise<RecordOperation | undefined> {
    const op = operation as ReplaceAttributeOperation;
    const { record, attribute } = op;
    const currentRecord = await cache.getRecordAsync(record);

    if (currentRecord === undefined) {
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
    cache: AsyncRecordAccessor,
    operation: RecordOperation,
    options?: RequestOptions
  ): Promise<RecordOperation | undefined> {
    const op = operation as AddToRelatedRecordsOperation;
    const { record, relationship, relatedRecord } = op;
    const currentRelatedRecords = await cache.getRelatedRecordsAsync(
      record,
      relationship
    );

    if (currentRelatedRecords === undefined) {
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
    cache: AsyncRecordAccessor,
    operation: RecordOperation,
    options?: RequestOptions
  ): Promise<RecordOperation | undefined> {
    const op = operation as RemoveFromRelatedRecordsOperation;
    const { record, relationship, relatedRecord } = op;
    const currentRelatedRecords = await cache.getRelatedRecordsAsync(
      record,
      relationship
    );

    if (currentRelatedRecords === undefined) {
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
    cache: AsyncRecordAccessor,
    operation: RecordOperation,
    options?: RequestOptions
  ): Promise<RecordOperation | undefined> {
    const op = operation as ReplaceRelatedRecordsOperation;
    const { record, relationship, relatedRecords } = op;
    const currentRelatedRecords = await cache.getRelatedRecordsAsync(
      record,
      relationship
    );

    if (currentRelatedRecords === undefined) {
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
    cache: AsyncRecordAccessor,
    operation: RecordOperation,
    options?: RequestOptions
  ): Promise<RecordOperation | undefined> {
    const op = operation as ReplaceRelatedRecordOperation;
    const { record, relationship, relatedRecord } = op;
    const currentRelatedRecord = await cache.getRelatedRecordAsync(
      record,
      relationship
    );

    if (currentRelatedRecord === undefined) {
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
