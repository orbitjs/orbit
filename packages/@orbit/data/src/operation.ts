import {
  Record,
  RecordIdentity,
  cloneRecordIdentity,
  equalRecordIdentities
} from './record';
import { eq, deepGet, deepSet } from '@orbit/utils';

/**
 * Base Operation interface, which requires just an `op` string.
 */
export interface Operation {
  op: string;
}

/**
 * Add record operation.
 */
export interface AddRecordOperation extends Operation {
  op: 'addRecord';
  record: Record;
}

/**
 * Update record operation.
 */
export interface UpdateRecordOperation extends Operation {
  op: 'updateRecord';
  record: Record;
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
  value: any;
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
  if (equalRecordIdentities(superceded.record, superceding.record)) {
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
            delete superceded.attribute;
            delete superceded.value;
          } else if (superceded.op === 'replaceRelatedRecord') {
            updateRecordReplaceHasOne(
              superceded.record,
              superceded.relationship,
              superceded.relatedRecord
            );
            delete superceded.relationship;
            delete superceded.relatedRecord;
          } else if (superceded.op === 'replaceRelatedRecords') {
            updateRecordReplaceHasMany(
              superceded.record,
              superceded.relationship,
              superceded.relatedRecords
            );
            delete superceded.relationship;
            delete superceded.relatedRecords;
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
          let record: Record = superceded.record;
          if (
            record.relationships &&
            record.relationships[superceding.relationship] &&
            record.relationships[superceding.relationship].data
          ) {
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
          let record: Record = superceded.record;
          if (
            record.relationships &&
            record.relationships[superceding.relationship] &&
            record.relationships[superceding.relationship].data
          ) {
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
        (superceded as ReplaceRelatedRecordOperation).relatedRecord,
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
  record: Record,
  attribute: string,
  value: any
) {
  record.attributes = record.attributes || {};
  record.attributes[attribute] = value;
}

function updateRecordReplaceHasOne(
  record: Record,
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
  record: Record,
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
  record: Record,
  relationship: string,
  relatedRecord: RecordIdentity
) {
  const data = deepGet(record, ['relationships', relationship, 'data']) || [];
  data.push(cloneRecordIdentity(relatedRecord));
  deepSet(record, ['relationships', relationship, 'data'], data);
}

function updateRecordRemoveFromHasMany(
  record: Record,
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

  return operations.filter(o => !isOperationMarkedToDelete(o));
}

/**
 * Determine the differences between a record and its updated version in terms
 * of a set of operations.
 */
export function recordDiffs(
  record: Record,
  updatedRecord: Record
): RecordOperation[] {
  const diffs: RecordOperation[] = [];

  if (record && updatedRecord) {
    const recordIdentity = cloneRecordIdentity(record);

    if (updatedRecord.attributes) {
      Object.keys(updatedRecord.attributes).forEach(attribute => {
        let value = updatedRecord.attributes[attribute];

        if (
          record.attributes === undefined ||
          !eq(record.attributes[attribute], value)
        ) {
          let op: ReplaceAttributeOperation = {
            op: 'replaceAttribute',
            record: recordIdentity,
            attribute,
            value
          };

          diffs.push(op);
        }
      });
    }

    if (updatedRecord.keys) {
      Object.keys(updatedRecord.keys).forEach(key => {
        let value = updatedRecord.keys[key];
        if (record.keys === undefined || !eq(record.keys[key], value)) {
          let op: ReplaceKeyOperation = {
            op: 'replaceKey',
            record: recordIdentity,
            key,
            value
          };

          diffs.push(op);
        }
      });
    }

    // TODO - handle relationships
  }

  return diffs;
}
