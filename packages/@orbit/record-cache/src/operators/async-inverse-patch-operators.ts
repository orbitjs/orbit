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
  RecordIdentity
} from '@orbit/records';
import { AsyncRecordAccessor } from '../record-accessor';

export interface AsyncInversePatchOperator {
  (cache: AsyncRecordAccessor, operation: RecordOperation): Promise<
    RecordOperation | undefined
  >;
}

export const AsyncInversePatchOperators: Dict<AsyncInversePatchOperator> = {
  async addRecord(
    cache: AsyncRecordAccessor,
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
    return;
  },

  async updateRecord(
    cache: AsyncRecordAccessor,
    operation: RecordOperation
  ): Promise<RecordOperation | undefined> {
    const op = operation as UpdateRecordOperation;
    const current = await cache.getRecordAsync(op.record);
    const replacement: Record = op.record;
    const { type, id } = replacement;

    if (current) {
      let result = { type, id };
      let changed = false;

      ['attributes', 'keys'].forEach((grouping) => {
        if ((replacement as any)[grouping]) {
          Object.keys((replacement as any)[grouping]).forEach((field) => {
            let value = (replacement as any)[grouping][field];
            let currentValue = deepGet(current, [grouping, field]);
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
            let currentData = deepGet(current, [
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
      return {
        op: 'removeRecord',
        record: { type, id }
      };
    }
    return;
  },

  async removeRecord(
    cache: AsyncRecordAccessor,
    operation: RecordOperation
  ): Promise<RecordOperation | undefined> {
    const op = operation as RemoveRecordOperation;
    const current = await cache.getRecordAsync(op.record);

    if (current) {
      return {
        op: 'addRecord',
        record: current
      };
    }
    return;
  },

  async replaceKey(
    cache: AsyncRecordAccessor,
    operation: RecordOperation
  ): Promise<RecordOperation | undefined> {
    const op = operation as ReplaceKeyOperation;
    const { key } = op;
    const record = await cache.getRecordAsync(op.record);
    const current = record && deepGet(record, ['keys', key]);

    if (!eq(current, op.value)) {
      const { type, id } = op.record;

      return {
        op: 'replaceKey',
        record: { type, id },
        key,
        value: current
      };
    }
    return;
  },

  async replaceAttribute(
    cache: AsyncRecordAccessor,
    operation: RecordOperation
  ): Promise<RecordOperation | undefined> {
    const op = operation as ReplaceAttributeOperation;
    const { attribute } = op;
    const record = await cache.getRecordAsync(op.record);
    const current = record && deepGet(record, ['attributes', attribute]);

    if (!eq(current, op.value)) {
      const { type, id } = op.record;

      return {
        op: 'replaceAttribute',
        record: { type, id },
        attribute,
        value: current
      };
    }
    return;
  },

  async addToRelatedRecords(
    cache: AsyncRecordAccessor,
    operation: RecordOperation
  ): Promise<RecordOperation | undefined> {
    const op = operation as AddToRelatedRecordsOperation;
    const { record, relationship, relatedRecord } = op;
    const currentRelatedRecords = await cache.getRelatedRecordsAsync(
      record,
      relationship
    );

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
    return;
  },

  async removeFromRelatedRecords(
    cache: AsyncRecordAccessor,
    operation: RecordOperation
  ): Promise<RecordOperation | undefined> {
    const op = operation as RemoveFromRelatedRecordsOperation;
    const { record, relationship, relatedRecord } = op;
    const currentRelatedRecords = await cache.getRelatedRecordsAsync(
      record,
      relationship
    );

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
    return;
  },

  async replaceRelatedRecords(
    cache: AsyncRecordAccessor,
    operation: RecordOperation
  ): Promise<RecordOperation | undefined> {
    const op = operation as ReplaceRelatedRecordsOperation;
    const { record, relationship, relatedRecords } = op;
    const currentRelatedRecords = await cache.getRelatedRecordsAsync(
      record,
      relationship
    );

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
    return;
  },

  async replaceRelatedRecord(
    cache: AsyncRecordAccessor,
    operation: RecordOperation
  ): Promise<RecordOperation | undefined> {
    const op = operation as ReplaceRelatedRecordOperation;
    const { record, relationship, relatedRecord } = op;
    const currentRelatedRecord = await cache.getRelatedRecordAsync(
      record,
      relationship
    );

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
    return;
  }
};
