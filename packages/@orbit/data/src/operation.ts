import { NormalizedRecord, LID } from './record';
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
  record: NormalizedRecord;
}

/**
 * Update record operation.
 */
export interface UpdateRecordOperation extends Operation {
  op: 'updateRecord';
  record: NormalizedRecord;
}

/**
 * Remove record operation.
 */
export interface RemoveRecordOperation extends Operation {
  op: 'removeRecord';
  record: LID;
}

/**
 * Replace key operation.
 */
export interface ReplaceKeyOperation extends Operation {
  op: 'replaceKey';
  record: LID;
  key: string;
  value: string;
}

/**
 * Replace attribute operation.
 */
export interface ReplaceAttributeOperation extends Operation {
  op: 'replaceAttribute';
  record: LID;
  attribute: string;
  value: any;
}

/**
 * Add to has-many relationship operation.
 */
export interface AddToRelatedRecordsOperation extends Operation {
  op: 'addToRelatedRecords';
  record: LID;
  relationship: string;
  relatedRecord: LID;
}

/**
 * Remove from has-many relationship operation.
 */
export interface RemoveFromRelatedRecordsOperation extends Operation {
  op: 'removeFromRelatedRecords';
  record: LID;
  relationship: string;
  relatedRecord: LID;
}

/**
 * Replace has-many relationship operation.
 */
export interface ReplaceRelatedRecordsOperation extends Operation {
  op: 'replaceRelatedRecords';
  record: LID;
  relationship: string;
  relatedRecords: LID[];
}

/**
 * Replace has-one relationship operation.
 */
export interface ReplaceRelatedRecordOperation extends Operation {
  op: 'replaceRelatedRecord';
  record: LID;
  relationship: string;
  relatedRecord: LID | null;
}

/**
 * Union of all record-related operations.
 */
export type RecordOperation = AddRecordOperation |
  UpdateRecordOperation |
  RemoveRecordOperation |
  ReplaceKeyOperation |
  ReplaceAttributeOperation |
  AddToRelatedRecordsOperation |
  RemoveFromRelatedRecordsOperation |
  ReplaceRelatedRecordsOperation |
  ReplaceRelatedRecordOperation;

function markOperationToDelete(operation: Operation): void {
  const o: any = operation;
  o._deleted = true;
}

function isOperationMarkedToDelete(operation: Operation): boolean {
  const o: any = operation;
  return o._deleted === true;
}

function mergeOperations(superceded: RecordOperation, superceding: RecordOperation, consecutiveOps: boolean): void {
  if (superceded.record === superceding.record) {
    if (superceding.op === 'removeRecord') {
      markOperationToDelete(superceded);
      if (superceded.op === 'addRecord') {
        markOperationToDelete(superceding);
      }
    } else if (!isOperationMarkedToDelete(superceding) && (consecutiveOps || superceding.op === 'replaceAttribute')) {
      if (isReplaceFieldOp(superceded.op) && isReplaceFieldOp(superceding.op)) {
        if (superceded.op === 'replaceAttribute' &&
            superceding.op === 'replaceAttribute' &&
            superceded.attribute === superceding.attribute) {
          markOperationToDelete(superceded);
        } else if (superceded.op === 'replaceRelatedRecord' &&
            superceding.op === 'replaceRelatedRecord' &&
            superceded.relationship === superceding.relationship) {
          markOperationToDelete(superceded);
        } else if (superceded.op === 'replaceRelatedRecords' &&
            superceding.op === 'replaceRelatedRecords' &&
            superceded.relationship === superceding.relationship) {
          markOperationToDelete(superceded);
        } else {
          let supercededRecord: NormalizedRecord;
          if (typeof superceded.record === 'string') {
            supercededRecord = {
              lid: superceded.record
            };
          } else {
            supercededRecord = superceded.record;
          }
          if (superceded.op === 'replaceAttribute') {
            updateRecordReplaceAttribute(supercededRecord, superceded.attribute, superceded.value);
            delete superceded.attribute;
            delete superceded.value;
          } else if (superceded.op === 'replaceRelatedRecord') {
            updateRecordReplaceHasOne(supercededRecord, superceded.relationship, superceded.relatedRecord);
            delete superceded.relationship;
            delete superceded.relatedRecord;
          } else if (superceded.op === 'replaceRelatedRecords') {
            updateRecordReplaceHasMany(supercededRecord, superceded.relationship, superceded.relatedRecords);
            delete superceded.relationship;
            delete superceded.relatedRecords;
          }
          if (superceding.op === 'replaceAttribute') {
            updateRecordReplaceAttribute(supercededRecord, superceding.attribute, superceding.value);
          } else if (superceding.op === 'replaceRelatedRecord') {
            updateRecordReplaceHasOne(supercededRecord, superceding.relationship, superceding.relatedRecord);
          } else if (superceding.op === 'replaceRelatedRecords') {
            updateRecordReplaceHasMany(supercededRecord, superceding.relationship, superceding.relatedRecords);
          }
          superceded.op = 'updateRecord';
          superceded.record = supercededRecord;
          markOperationToDelete(superceding);
        }
      } else if ((superceded.op === 'addRecord' || superceded.op === 'updateRecord' || (superceded as any).op === 'replaceRecord') &&
                 isReplaceFieldOp(superceding.op)) {
        if (superceding.op === 'replaceAttribute') {
          updateRecordReplaceAttribute(superceded.record as NormalizedRecord, superceding.attribute, superceding.value);
        } else if (superceding.op === 'replaceRelatedRecord') {
          updateRecordReplaceHasOne(superceded.record as NormalizedRecord, superceding.relationship, superceding.relatedRecord);
        } else if (superceding.op === 'replaceRelatedRecords') {
          updateRecordReplaceHasMany(superceded.record as NormalizedRecord, superceding.relationship, superceding.relatedRecords);
        }
        markOperationToDelete(superceding);
      } else if (superceding.op === 'addToRelatedRecords') {
        if (superceded.op === 'addRecord') {
          updateRecordAddToHasMany(superceded.record, superceding.relationship, superceding.relatedRecord);
          markOperationToDelete(superceding);
        } else if (superceded.op === 'updateRecord' || (superceded as any).op === 'replaceRecord') {
          let record = superceded.record as NormalizedRecord;
          if (record.relationships &&
              record.relationships[superceding.relationship] &&
              record.relationships[superceding.relationship].data) {
            updateRecordAddToHasMany(superceded.record as NormalizedRecord, superceding.relationship, superceding.relatedRecord);
            markOperationToDelete(superceding);
          }
        }
      } else if (superceding.op === 'removeFromRelatedRecords') {
        if (superceded.op === 'addToRelatedRecords' &&
            superceded.relationship === superceding.relationship &&
            superceded.relatedRecord === superceding.relatedRecord) {
          markOperationToDelete(superceded);
          markOperationToDelete(superceding);
        } else if (superceded.op === 'addRecord' || superceded.op === 'updateRecord' || (superceded as any).op === 'replaceRecord') {
          let record = superceded.record as NormalizedRecord;
          if (record.relationships &&
              record.relationships[superceding.relationship] &&
              record.relationships[superceding.relationship].data) {
            updateRecordRemoveFromHasMany(superceded.record as NormalizedRecord, superceding.relationship, superceding.relatedRecord);
            markOperationToDelete(superceding);
          }
        }
      }
    }
  } else if (superceding.record && superceding.op === 'removeRecord') {
    if ((superceded as ReplaceRelatedRecordOperation).relatedRecord &&
        (superceded as ReplaceRelatedRecordOperation).relatedRecord === superceding.record) {
      markOperationToDelete(superceded);
    }
  }
}

function isReplaceFieldOp(op: string): boolean {
  return (op === 'replaceAttribute' ||
          op === 'replaceRelatedRecord' ||
          op === 'replaceRelatedRecords');
}

function updateRecordReplaceAttribute(record: NormalizedRecord, attribute: string, value: any) {
  record.attributes = record.attributes || {};
  record.attributes[attribute] = value;
}

function updateRecordReplaceHasOne(record: NormalizedRecord, relationship: string, relatedRecord: LID) {
  deepSet(record, ['relationships', relationship, 'data'], relatedRecord);
}

function updateRecordReplaceHasMany(record: NormalizedRecord, relationship: string, relatedRecords: LID[]) {
  deepSet(record, ['relationships', relationship, 'data'], Array.from(relatedRecords));
}

function updateRecordAddToHasMany(record: NormalizedRecord, relationship: string, relatedRecord: LID) {
  const data = deepGet(record, ['relationships', relationship, 'data']) || [];
  data.push(relatedRecord);
  deepSet(record, ['relationships', relationship, 'data'], data);
}

function updateRecordRemoveFromHasMany(record: NormalizedRecord, relationship: string, relatedRecord: LID) {
  const data = deepGet(record, ['relationships', relationship, 'data']) as LID[];
  if (data) {
    for (let i = 0, l = data.length; i < l; i++) {
      if (data[i] === relatedRecord) {
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
export function coalesceRecordOperations(operations: RecordOperation[]): RecordOperation[] {
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
export function recordDiffs(record: NormalizedRecord, updatedRecord: NormalizedRecord): RecordOperation[] {
  const diffs: RecordOperation[] = [];

  if (record && updatedRecord) {
    const { lid } = record;

    if (updatedRecord.attributes) {
      Object.keys(updatedRecord.attributes).forEach(attribute => {
        let value = updatedRecord.attributes[attribute];

        if (record.attributes === undefined || !eq(record.attributes[attribute], value)) {
          let op: ReplaceAttributeOperation = {
            op: 'replaceAttribute',
            record: lid,
            attribute,
            value
          }

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
            record: lid,
            key,
            value
          }

          diffs.push(op);
        }
      });
    }

    // TODO - handle relationships
  }

  return diffs;
}
