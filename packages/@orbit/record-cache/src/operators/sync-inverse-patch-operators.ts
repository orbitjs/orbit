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
import { SyncRecordAccessor } from '../record-accessor';

export interface SyncInversePatchOperator {
  (cache: SyncRecordAccessor, op: RecordOperation): RecordOperation;
}

export const SyncInversePatchOperators: Dict<SyncInversePatchOperator> = {
  addRecord(cache: SyncRecordAccessor, op: AddRecordOperation): RecordOperation {
    const { type, id } = op.record;
    const current = cache.getRecordSync(op.record);

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

  updateRecord(cache: SyncRecordAccessor, op: UpdateRecordOperation): RecordOperation {
    const current = cache.getRecordSync(op.record);
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
          let currentData = deepGet(current, ['relationships', field, 'data']);
          let data = deepGet(replacement, ['relationships', field, 'data']);

          let relationshipMatch;
          if (isArray(data)) {
            relationshipMatch = equalRecordIdentitySets(currentData, data);
          } else {
            relationshipMatch = equalRecordIdentities(currentData, data);
          }

          if (!relationshipMatch) {
            changed = true;
            deepSet(result, ['relationships', field, 'data'], currentData === undefined ? null : currentData);
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

  removeRecord(cache: SyncRecordAccessor, op: RemoveRecordOperation): RecordOperation {
    const current = cache.getRecordSync(op.record);

    if (current) {
      return {
        op: 'addRecord',
        record: current
      };
    }
  },

  replaceKey(cache: SyncRecordAccessor, op: ReplaceKeyOperation): RecordOperation {
    const { key } = op;
    const record = cache.getRecordSync(op.record);
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

  replaceAttribute(cache: SyncRecordAccessor, op: ReplaceAttributeOperation): RecordOperation {
    const { attribute } = op;
    const record = cache.getRecordSync(op.record);
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

  addToRelatedRecords(cache: SyncRecordAccessor, op: AddToRelatedRecordsOperation): RecordOperation {
    const { record, relationship, relatedRecord } = op;
    const currentRelatedRecords = cache.getRelatedRecordsSync(record, relationship);

    if (currentRelatedRecords === undefined || !recordsInclude(currentRelatedRecords, relatedRecord)) {
      return {
        op: 'removeFromRelatedRecords',
        record,
        relationship,
        relatedRecord
      };
    }
  },

  removeFromRelatedRecords(cache: SyncRecordAccessor, op: RemoveFromRelatedRecordsOperation): RecordOperation {
    const { record, relationship, relatedRecord } = op;
    const currentRelatedRecords = cache.getRelatedRecordsSync(record, relationship);

    if (currentRelatedRecords !== undefined && recordsInclude(currentRelatedRecords, relatedRecord)) {
      return {
        op: 'addToRelatedRecords',
        record,
        relationship,
        relatedRecord
      };
    }
  },

  replaceRelatedRecords(cache: SyncRecordAccessor, op: ReplaceRelatedRecordsOperation): RecordOperation {
    const { record, relationship, relatedRecords } = op;
    const currentRelatedRecords = cache.getRelatedRecordsSync(record, relationship);

    if (currentRelatedRecords === undefined || !equalRecordIdentitySets(currentRelatedRecords, relatedRecords)) {
      return {
        op: 'replaceRelatedRecords',
        record,
        relationship,
        relatedRecords: currentRelatedRecords || []
      };
    }
  },

  replaceRelatedRecord(cache: SyncRecordAccessor, op: ReplaceRelatedRecordOperation): RecordOperation {
    const { record, relationship, relatedRecord } = op;
    const currentRelatedRecord = cache.getRelatedRecordSync(record, relationship);

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
