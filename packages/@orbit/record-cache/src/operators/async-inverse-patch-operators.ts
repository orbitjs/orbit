import { Dict, deepGet, deepSet, eq, isArray } from '@orbit/utils';
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
  recordsInclude
} from '@orbit/data';
import { AsyncRecordAccessor } from '../record-accessor';

export interface AsyncInversePatchOperator {
  (cache: AsyncRecordAccessor, op: RecordOperation): Promise<RecordOperation>;
}

export const AsyncInversePatchOperators: Dict<AsyncInversePatchOperator> = {
  async addRecord(cache: AsyncRecordAccessor, op: AddRecordOperation): Promise<RecordOperation> {
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

  async updateRecord(cache: AsyncRecordAccessor, op: UpdateRecordOperation): Promise<RecordOperation> {
    const current = await cache.getRecordAsync(op.record);
    const replacement: Record = op.record;
    const { type, id } = replacement;

    if (current) {
      let result = { type, id };
      let changed = false;

      ['attributes', 'keys'].forEach(grouping => {
        if ((replacement as any)[grouping]) {
          Object.keys((replacement as any)[grouping]).forEach(field => {
            let value = (replacement as any)[grouping][field];
            let currentValue = deepGet(current, [grouping, field]);
            if (!eq(value, currentValue)) {
              changed = true;
              deepSet(result, [grouping, field], currentValue === undefined ? null : currentValue);
            }
          });
        }
      });

      if (replacement.relationships) {
        Object.keys(replacement.relationships).forEach(field => {
          let data = deepGet(replacement, ['relationships', field, 'data']);
          if (data !== undefined) {
            let currentData = deepGet(current, ['relationships', field, 'data']);
            let relationshipChanged;

            if (isArray(data)) {
              if (currentData) {
                relationshipChanged = !equalRecordIdentitySets(currentData, data);
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
  },

  async removeRecord(cache: AsyncRecordAccessor, op: RemoveRecordOperation): Promise<RecordOperation> {
    const current = await cache.getRecordAsync(op.record);

    if (current) {
      return {
        op: 'addRecord',
        record: current
      };
    }
  },

  async replaceKey(cache: AsyncRecordAccessor, op: ReplaceKeyOperation): Promise<RecordOperation> {
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
  },

  async replaceAttribute(cache: AsyncRecordAccessor, op: ReplaceAttributeOperation): Promise<RecordOperation> {
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
  },

  async addToRelatedRecords(cache: AsyncRecordAccessor, op: AddToRelatedRecordsOperation): Promise<RecordOperation> {
    const { record, relationship, relatedRecord } = op;
    const currentRelatedRecords = await cache.getRelatedRecordsAsync(record, relationship);

    if (currentRelatedRecords === undefined || !recordsInclude(currentRelatedRecords, relatedRecord)) {
      return {
        op: 'removeFromRelatedRecords',
        record,
        relationship,
        relatedRecord
      };
    }
  },

  async removeFromRelatedRecords(cache: AsyncRecordAccessor, op: RemoveFromRelatedRecordsOperation): Promise<RecordOperation> {
    const { record, relationship, relatedRecord } = op;
    const currentRelatedRecords = await cache.getRelatedRecordsAsync(record, relationship);

    if (currentRelatedRecords !== undefined && recordsInclude(currentRelatedRecords, relatedRecord)) {
      return {
        op: 'addToRelatedRecords',
        record,
        relationship,
        relatedRecord
      };
    }
  },

  async replaceRelatedRecords(cache: AsyncRecordAccessor, op: ReplaceRelatedRecordsOperation): Promise<RecordOperation> {
    const { record, relationship, relatedRecords } = op;
    const currentRelatedRecords = await cache.getRelatedRecordsAsync(record, relationship);

    if (currentRelatedRecords === undefined || !equalRecordIdentitySets(currentRelatedRecords, relatedRecords)) {
      return {
        op: 'replaceRelatedRecords',
        record,
        relationship,
        relatedRecords: currentRelatedRecords || []
      };
    }
  },

  async replaceRelatedRecord(cache: AsyncRecordAccessor, op: ReplaceRelatedRecordOperation): Promise<RecordOperation> {
    const { record, relationship, relatedRecord } = op;
    const currentRelatedRecord = await cache.getRelatedRecordAsync(record, relationship);

    if (currentRelatedRecord === undefined || !equalRecordIdentities(currentRelatedRecord, relatedRecord)) {
      return {
        op: 'replaceRelatedRecord',
        record,
        relationship,
        relatedRecord: currentRelatedRecord || null
      };
    }
  }
};
