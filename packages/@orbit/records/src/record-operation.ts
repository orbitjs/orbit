import { eq, deepGet, deepSet } from '@orbit/utils';
import { Operation } from '@orbit/data';
import {
  InitializedRecord,
  RecordIdentity,
  cloneRecordIdentity,
  equalRecordIdentities,
  mergeRecords,
  dedupeRecordIdentities
} from './record';

/**
 * Add record operation.
 */
export interface AddRecordOperation extends Operation {
  op: 'addRecord';
  record: InitializedRecord;
}

/**
 * Update record operation.
 */
export interface UpdateRecordOperation extends Operation {
  op: 'updateRecord';
  record: InitializedRecord;
}

/**
 * Remove record operation.
 */
export interface RemoveRecordOperation extends Operation {
  op: 'removeRecord';
  record: RecordIdentity;
}

/**
 * Replace key operation.
 */
export interface ReplaceKeyOperation extends Operation {
  op: 'replaceKey';
  record: RecordIdentity;
  key: string;
  value: string;
}

/**
 * Replace attribute operation.
 */
export interface ReplaceAttributeOperation extends Operation {
  op: 'replaceAttribute';
  record: RecordIdentity;
  attribute: string;
  value: unknown;
}

/**
 * Add to has-many relationship operation.
 */
export interface AddToRelatedRecordsOperation extends Operation {
  op: 'addToRelatedRecords';
  record: RecordIdentity;
  relationship: string;
  relatedRecord: RecordIdentity;
}

/**
 * Remove from has-many relationship operation.
 */
export interface RemoveFromRelatedRecordsOperation extends Operation {
  op: 'removeFromRelatedRecords';
  record: RecordIdentity;
  relationship: string;
  relatedRecord: RecordIdentity;
}

/**
 * Replace has-many relationship operation.
 */
export interface ReplaceRelatedRecordsOperation extends Operation {
  op: 'replaceRelatedRecords';
  record: RecordIdentity;
  relationship: string;
  relatedRecords: RecordIdentity[];
}

/**
 * Replace has-one relationship operation.
 */
export interface ReplaceRelatedRecordOperation extends Operation {
  op: 'replaceRelatedRecord';
  record: RecordIdentity;
  relationship: string;
  relatedRecord: RecordIdentity | null;
}

/**
 * Union of all record-related operations.
 */
export type RecordOperation =
  | AddRecordOperation
  | UpdateRecordOperation
  | RemoveRecordOperation
  | ReplaceKeyOperation
  | ReplaceAttributeOperation
  | AddToRelatedRecordsOperation
  | RemoveFromRelatedRecordsOperation
  | ReplaceRelatedRecordsOperation
  | ReplaceRelatedRecordOperation;

export type AddRecordOperationResult = InitializedRecord;
export type UpdateRecordOperationResult = undefined;
export type RemoveRecordOperationResult = undefined;
export type ReplaceKeyOperationResult = undefined;
export type ReplaceAttributeOperationResult = undefined;
export type AddToRelatedRecordsOperationResult = undefined;
export type RemoveFromRelatedRecordsOperationResult = undefined;
export type ReplaceRelatedRecordsOperationResult = undefined;
export type ReplaceRelatedRecordOperationResult = undefined;

export type RecordOperationResult<T = InitializedRecord> = T | undefined;

function markOperationToDelete(operation: Operation): void {
  const o: any = operation;
  o._deleted = true;
}

function isOperationMarkedToDelete(operation: Operation): boolean {
  const o: any = operation;
  return o._deleted === true;
}

function mergeOperations(
  superceded: RecordOperation,
  superceding: RecordOperation,
  consecutiveOps: boolean
): void {
  if (superceded.options || superceding.options) {
    // do not merge if one of the operations have options
    return;
  } else if (equalRecordIdentities(superceded.record, superceding.record)) {
    if (superceding.op === 'removeRecord') {
      markOperationToDelete(superceded);
      if (superceded.op === 'addRecord') {
        markOperationToDelete(superceding);
      }
    } else if (
      !isOperationMarkedToDelete(superceding) &&
      (consecutiveOps || superceding.op === 'replaceAttribute')
    ) {
      if (isReplaceFieldOp(superceded.op) && isReplaceFieldOp(superceding.op)) {
        if (
          superceded.op === 'replaceAttribute' &&
          superceding.op === 'replaceAttribute' &&
          superceded.attribute === superceding.attribute
        ) {
          markOperationToDelete(superceded);
        } else if (
          superceded.op === 'replaceRelatedRecord' &&
          superceding.op === 'replaceRelatedRecord' &&
          superceded.relationship === superceding.relationship
        ) {
          markOperationToDelete(superceded);
        } else if (
          superceded.op === 'replaceRelatedRecords' &&
          superceding.op === 'replaceRelatedRecords' &&
          superceded.relationship === superceding.relationship
        ) {
          markOperationToDelete(superceded);
        } else {
          if (superceded.op === 'replaceAttribute') {
            updateRecordReplaceAttribute(
              superceded.record,
              superceded.attribute,
              superceded.value
            );
            delete (superceded as any).attribute;
            delete superceded.value;
          } else if (superceded.op === 'replaceRelatedRecord') {
            updateRecordReplaceHasOne(
              superceded.record,
              superceded.relationship,
              superceded.relatedRecord
            );
            delete (superceded as any).relationship;
            delete (superceded as any).relatedRecord;
          } else if (superceded.op === 'replaceRelatedRecords') {
            updateRecordReplaceHasMany(
              superceded.record,
              superceded.relationship,
              superceded.relatedRecords
            );
            delete (superceded as any).relationship;
            delete (superceded as any).relatedRecords;
          }
          if (superceding.op === 'replaceAttribute') {
            updateRecordReplaceAttribute(
              superceded.record,
              superceding.attribute,
              superceding.value
            );
          } else if (superceding.op === 'replaceRelatedRecord') {
            updateRecordReplaceHasOne(
              superceded.record,
              superceding.relationship,
              superceding.relatedRecord
            );
          } else if (superceding.op === 'replaceRelatedRecords') {
            updateRecordReplaceHasMany(
              superceded.record,
              superceding.relationship,
              superceding.relatedRecords
            );
          }
          superceded.op = 'updateRecord';
          markOperationToDelete(superceding);
        }
      } else if (
        (superceded.op === 'addRecord' ||
          superceded.op === 'updateRecord' ||
          (superceded as any).op === 'replaceRecord') &&
        (superceding.op === 'updateRecord' ||
          (superceding as any).op === 'replaceRecord')
      ) {
        superceded.record = mergeRecords(superceded.record, superceding.record);
        markOperationToDelete(superceding);
      } else if (
        (superceded.op === 'addRecord' ||
          superceded.op === 'updateRecord' ||
          (superceded as any).op === 'replaceRecord') &&
        isReplaceFieldOp(superceding.op)
      ) {
        if (superceding.op === 'replaceAttribute') {
          updateRecordReplaceAttribute(
            superceded.record,
            superceding.attribute,
            superceding.value
          );
        } else if (superceding.op === 'replaceRelatedRecord') {
          updateRecordReplaceHasOne(
            superceded.record,
            superceding.relationship,
            superceding.relatedRecord
          );
        } else if (superceding.op === 'replaceRelatedRecords') {
          updateRecordReplaceHasMany(
            superceded.record,
            superceding.relationship,
            superceding.relatedRecords
          );
        }
        markOperationToDelete(superceding);
      } else if (superceding.op === 'addToRelatedRecords') {
        if (superceded.op === 'addRecord') {
          updateRecordAddToHasMany(
            superceded.record,
            superceding.relationship,
            superceding.relatedRecord
          );
          markOperationToDelete(superceding);
        } else if (
          superceded.op === 'updateRecord' ||
          (superceded as any).op === 'replaceRecord'
        ) {
          let record: InitializedRecord = superceded.record;
          if (record.relationships?.[superceding.relationship]?.data) {
            updateRecordAddToHasMany(
              superceded.record,
              superceding.relationship,
              superceding.relatedRecord
            );
            markOperationToDelete(superceding);
          }
        }
      } else if (superceding.op === 'removeFromRelatedRecords') {
        if (
          superceded.op === 'addToRelatedRecords' &&
          superceded.relationship === superceding.relationship &&
          equalRecordIdentities(
            superceded.relatedRecord,
            superceding.relatedRecord
          )
        ) {
          markOperationToDelete(superceded);
          markOperationToDelete(superceding);
        } else if (
          superceded.op === 'addRecord' ||
          superceded.op === 'updateRecord' ||
          (superceded as any).op === 'replaceRecord'
        ) {
          let record: InitializedRecord = superceded.record;
          if (record.relationships?.[superceding.relationship]?.data) {
            updateRecordRemoveFromHasMany(
              superceded.record,
              superceding.relationship,
              superceding.relatedRecord
            );
            markOperationToDelete(superceding);
          }
        }
      }
    }
  } else if (superceding.record && superceding.op === 'removeRecord') {
    if (
      (superceded as ReplaceRelatedRecordOperation).relatedRecord &&
      equalRecordIdentities(
        (superceded as ReplaceRelatedRecordOperation)
          .relatedRecord as RecordIdentity,
        superceding.record
      )
    ) {
      markOperationToDelete(superceded);
    }
  }
}

function isReplaceFieldOp(op: string): boolean {
  return (
    op === 'replaceAttribute' ||
    op === 'replaceRelatedRecord' ||
    op === 'replaceRelatedRecords'
  );
}

function updateRecordReplaceAttribute(
  record: InitializedRecord,
  attribute: string,
  value: unknown
) {
  deepSet(record, ['attributes', attribute], value);
}

function updateRecordReplaceHasOne(
  record: InitializedRecord,
  relationship: string,
  relatedRecord: RecordIdentity | null
) {
  deepSet(
    record,
    ['relationships', relationship, 'data'],
    relatedRecord ? cloneRecordIdentity(relatedRecord) : null
  );
}

function updateRecordReplaceHasMany(
  record: InitializedRecord,
  relationship: string,
  relatedRecords: RecordIdentity[]
) {
  deepSet(
    record,
    ['relationships', relationship, 'data'],
    relatedRecords.map(cloneRecordIdentity)
  );
}

function updateRecordAddToHasMany(
  record: InitializedRecord,
  relationship: string,
  relatedRecord: RecordIdentity
) {
  const data = deepGet(record, ['relationships', relationship, 'data']) || [];
  data.push(cloneRecordIdentity(relatedRecord));
  deepSet(record, ['relationships', relationship, 'data'], data);
}

function updateRecordRemoveFromHasMany(
  record: InitializedRecord,
  relationship: string,
  relatedRecord: RecordIdentity
) {
  const data = deepGet(record, [
    'relationships',
    relationship,
    'data'
  ]) as RecordIdentity[];
  if (data) {
    for (let i = 0, l = data.length; i < l; i++) {
      let r = data[i];
      if (equalRecordIdentities(r, relatedRecord)) {
        data.splice(i, 1);
        break;
      }
    }
  }
}

/**
 * Coalesces operations into a minimal set of equivalent operations.
 *
 * This method respects the order of the operations array and does not allow
 * reordering of operations that affect relationships.
 */
export function coalesceRecordOperations(
  operations: RecordOperation[]
): RecordOperation[] {
  for (let i = 0, l = operations.length; i < l; i++) {
    let currentOp = operations[i];
    let consecutiveOps = true;

    for (let j = i + 1; j < l; j++) {
      let nextOp = operations[j];

      mergeOperations(currentOp, nextOp, consecutiveOps);

      if (isOperationMarkedToDelete(currentOp)) {
        break;
      } else if (!isOperationMarkedToDelete(nextOp)) {
        consecutiveOps = false;
      }
    }
  }

  return operations.filter((o) => !isOperationMarkedToDelete(o));
}

/**
 * Determine the differences between a record and its updated version in terms
 * of a set of operations.
 */
export function recordDiffs(
  record: InitializedRecord,
  updatedRecord: InitializedRecord
): RecordOperation[] {
  const ops: RecordOperation[] = [];

  if (record && updatedRecord) {
    let fullRecordUpdate = false;
    const recordIdentity = cloneRecordIdentity(record);
    const diffRecord: InitializedRecord = { ...recordIdentity };

    for (let member in updatedRecord) {
      if (member !== 'id' && member !== 'type') {
        let value: unknown;
        let updatedValue: unknown;

        switch (member) {
          case 'attributes':
          case 'keys':
          case 'relationships':
            for (let field in updatedRecord[member]) {
              value = record[member]?.[field];
              updatedValue = (updatedRecord[member] as any)[field];

              if (!eq(value, updatedValue)) {
                if (member === 'relationships') {
                  fullRecordUpdate = true;
                }
                deepSet(diffRecord, [member, field], updatedValue);
              }
            }
            break;

          default:
            value = (record as any)[member];
            updatedValue = (updatedRecord as any)[member];

            if (!eq(updatedValue, value)) {
              (diffRecord as any)[member] = updatedValue;
              fullRecordUpdate = true;
            }
        }
      }
    }

    // If updates consist solely of attributes and keys, update fields
    // with individual operations. Otherwise, update the record as a
    // whole.
    if (fullRecordUpdate) {
      let op: UpdateRecordOperation = {
        op: 'updateRecord',
        record: diffRecord
      };
      ops.push(op);
    } else {
      if (diffRecord.attributes) {
        for (let attribute in diffRecord.attributes) {
          let value = diffRecord.attributes[attribute];
          let op: ReplaceAttributeOperation = {
            op: 'replaceAttribute',
            record: recordIdentity,
            attribute,
            value
          };
          ops.push(op);
        }
      }
      if (diffRecord.keys) {
        for (let key in diffRecord.keys) {
          let value = diffRecord.keys[key];
          let op: ReplaceKeyOperation = {
            op: 'replaceKey',
            record: recordIdentity,
            key,
            value
          };
          ops.push(op);
        }
      }
    }
  }

  return ops;
}

/**
 * Returns the deduped identities of all the records directly referenced by an
 * array of operations.
 */
export function recordsReferencedByOperations(
  operations: RecordOperation[]
): RecordIdentity[] {
  const records = [];

  for (let operation of operations) {
    if (operation.record) {
      records.push(operation.record);

      if (operation.op === 'addRecord' || operation.op === 'updateRecord') {
        let record = operation.record;
        if (record.relationships) {
          for (let relName in record.relationships) {
            let rel = record.relationships[relName];
            if (rel?.data) {
              if (Array.isArray(rel.data)) {
                Array.prototype.push.apply(records, rel.data);
              } else {
                records.push(rel.data);
              }
            }
          }
        }
      }
    }
    if (
      operation.op === 'addToRelatedRecords' ||
      operation.op === 'removeFromRelatedRecords' ||
      operation.op === 'replaceRelatedRecord'
    ) {
      if (operation.relatedRecord) {
        records.push(operation.relatedRecord);
      }
    } else if (operation.op === 'replaceRelatedRecords') {
      Array.prototype.push.apply(records, operation.relatedRecords);
    }
  }

  return dedupeRecordIdentities(records);
}
