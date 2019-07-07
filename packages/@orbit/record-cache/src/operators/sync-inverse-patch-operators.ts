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
  recordsInclude,
  RecordIdentity
} from '@orbit/data';
import { SyncRecordAccessor } from '../record-accessor';

export interface SyncInversePatchOperator {
  (cache: SyncRecordAccessor, op: RecordOperation): RecordOperation | undefined;
}

export const SyncInversePatchOperators: Dict<SyncInversePatchOperator> = {
  addRecord(
    cache: SyncRecordAccessor,
    op: AddRecordOperation
  ): RecordOperation | undefined {
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

  updateRecord(
    cache: SyncRecordAccessor,
    op: UpdateRecordOperation
  ): RecordOperation | undefined {
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
        Object.keys(replacement.relationships).forEach(field => {
          let data = deepGet(replacement, ['relationships', field, 'data']);
          if (data !== undefined) {
            let currentData = deepGet(current, [
              'relationships',
              field,
              'data'
            ]);
            let relationshipChanged;

            if (isArray(data)) {
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

  removeRecord(
    cache: SyncRecordAccessor,
    op: RemoveRecordOperation
  ): RecordOperation | undefined {
    const current = cache.getRecordSync(op.record);

    if (current) {
      return {
        op: 'addRecord',
        record: current
      };
    }

    return;
  },

  replaceKey(
    cache: SyncRecordAccessor,
    op: ReplaceKeyOperation
  ): RecordOperation | undefined {
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
    return;
  },

  replaceAttribute(
    cache: SyncRecordAccessor,
    op: ReplaceAttributeOperation
  ): RecordOperation | undefined {
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
    return;
  },

  addToRelatedRecords(
    cache: SyncRecordAccessor,
    op: AddToRelatedRecordsOperation
  ): RecordOperation | undefined {
    const { record, relationship, relatedRecord } = op;
    const currentRelatedRecords = cache.getRelatedRecordsSync(
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

  removeFromRelatedRecords(
    cache: SyncRecordAccessor,
    op: RemoveFromRelatedRecordsOperation
  ): RecordOperation | undefined {
    const { record, relationship, relatedRecord } = op;
    const currentRelatedRecords = cache.getRelatedRecordsSync(
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

  replaceRelatedRecords(
    cache: SyncRecordAccessor,
    op: ReplaceRelatedRecordsOperation
  ): RecordOperation | undefined {
    const { record, relationship, relatedRecords } = op;
    const currentRelatedRecords = cache.getRelatedRecordsSync(
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

  replaceRelatedRecord(
    cache: SyncRecordAccessor,
    op: ReplaceRelatedRecordOperation
  ): RecordOperation | undefined {
    const { record, relationship, relatedRecord } = op;
    const currentRelatedRecord = cache.getRelatedRecordSync(
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
