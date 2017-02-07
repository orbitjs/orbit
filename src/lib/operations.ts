/* eslint-disable valid-jsdoc */
import { eq } from './eq';
import { Identity, identity, eqIdentity, toIdentifier } from './identifiers';

export interface Record extends Identity {
  keys?: Object; // TODO
  attributes?: Object;
  relationships?: Object; // TODO
}

export interface Operation {
  op: string;
  record?: Record;
  attribute?: string;
  relationship?: string;
  relatedRecord?: Identity;
  relatedRecords?: Identity[];
  value?: any;
  _deleted?: boolean;
}

export interface RemoveRecordOperation extends Operation {
  op: 'removeRecord';
  record: Identity;
}

export interface AddRecordOperation extends Operation {
  op: 'addRecord';
  record: Record;
}

function mergeOps(superceded: Operation, superceding: Operation, consecutiveOps: boolean): void {
  if (eqIdentity(superceded.record, superceding.record)) {
    if (superceding.op === 'removeRecord') {
      superceded._deleted = true;
      if (superceded.op === 'addRecord') {
        superceding._deleted = true;
      }
    } else if (!superceding._deleted && (consecutiveOps || superceding.op === 'replaceAttribute')) {
      if (isReplaceFieldOp(superceded.op) && isReplaceFieldOp(superceding.op)) {
        if (superceded.op === superceding.op &&
            ((superceded.op === 'replaceAttribute' && superceded.attribute === superceding.attribute) ||
             (superceded.relationship === superceding.relationship))) {
          superceded._deleted = true;
        } else {
          superceded.op = 'replaceRecord';
          if (superceded.op === 'replaceAttribute') {
            replaceRecordAttribute(superceded.record, superceded.attribute, superceded.value);
            delete superceded.attribute;
            delete superceded.value;
          } else if (superceded.op === 'replaceHasOne') {
            replaceRecordHasOne(superceded.record, superceded.relationship, superceded.relatedRecord);
            delete superceded.relationship;
            delete superceded.relatedRecord;
          } else if (superceded.op === 'replaceHasMany') {
            replaceRecordHasMany(superceded.record, superceded.relationship, superceded.relatedRecords);
            delete superceded.relationship;
            delete superceded.relatedRecords;
          }
          if (superceding.op === 'replaceAttribute') {
            replaceRecordAttribute(superceded.record, superceding.attribute, superceding.value);
          } else if (superceding.op === 'replaceHasOne') {
            replaceRecordHasOne(superceded.record, superceding.relationship, superceding.relatedRecord);
          } else if (superceding.op === 'replaceHasMany') {
            replaceRecordHasMany(superceded.record, superceding.relationship, superceding.relatedRecords);
          }
        }
      } else if ((superceded.op === 'addRecord' || superceded.op === 'replaceRecord') &&
                 isReplaceFieldOp(superceding.op)) {
        if (superceding.op === 'replaceAttribute') {
          replaceRecordAttribute(superceded.record, superceding.attribute, superceding.value);
        } else if (superceding.op === 'replaceHasOne') {
          replaceRecordHasOne(superceded.record, superceding.relationship, superceding.relatedRecord);
        } else if (superceding.op === 'replaceHasMany') {
          replaceRecordHasMany(superceded.record, superceding.relationship, superceding.relatedRecords);
        }
        superceding._deleted = true;
      } else if (superceding.op === 'addToHasMany') {
        if (superceded.op === 'addRecord') {
          addToHasMany(superceded.record, superceding.relationship, superceding.relatedRecord);
          superceding._deleted = true;
        } else if (superceded.op === 'replaceRecord') {
          if (superceded.record.relationships &&
              superceded.record.relationships[superceding.relationship] &&
              superceded.record.relationships[superceding.relationship].data) {
            addToHasMany(superceded.record, superceding.relationship, superceding.relatedRecord);
            superceding._deleted = true;
          }
        }
      } else if (superceding.op === 'removeFromHasMany') {
        if (superceded.op === 'addToHasMany' &&
            superceded.relationship === superceding.relationship &&
            eqIdentity(superceded.relatedRecord, superceding.relatedRecord)) {
          superceded._deleted = true;
          superceding._deleted = true;
        } else if (superceded.op === 'addRecord' || superceded.op === 'replaceRecord') {
          if (superceded.record.relationships &&
              superceded.record.relationships[superceding.relationship] &&
              superceded.record.relationships[superceding.relationship].data &&
              superceded.record.relationships[superceding.relationship].data[toIdentifier(superceding.relatedRecord)]) {
            delete superceded.record.relationships[superceding.relationship].data[toIdentifier(superceding.relatedRecord)];
            superceding._deleted = true;
          }
        }
      }
    }
  }
}

function isReplaceFieldOp(op: string): boolean {
  return (op === 'replaceAttribute' ||
          op === 'replaceHasOne' ||
          op === 'replaceHasMany');
}

function replaceRecordAttribute(record: Record, attribute: string, value: any) {
  record.attributes = record.attributes || {};
  record.attributes[attribute] = value;
}

function replaceRecordHasOne(record: Record, relationship: string, relatedRecord: Identity) {
  record.relationships = record.relationships || {};
  record.relationships[relationship] = record.relationships[relationship] || {};
  record.relationships[relationship].data = toIdentifier(relatedRecord);
}

function replaceRecordHasMany(record: Record, relationship: string, relatedRecords: Identity[]) {
  record.relationships = record.relationships || {};
  record.relationships[relationship] = record.relationships[relationship] || {};
  let relatedRecordData = {};
  relatedRecords.forEach(r => {
    relatedRecordData[toIdentifier(r)] = true;
  });
  record.relationships[relationship].data = relatedRecordData;
}

function addToHasMany(record: Record, relationship: string, relatedRecord: Identity) {
  record.relationships = record.relationships || {};
  record.relationships[relationship] = record.relationships[relationship] || {};
  record.relationships[relationship].data = record.relationships[relationship].data || {};
  record.relationships[relationship].data[toIdentifier(relatedRecord)] = true;
}

/**
 Coalesces operations into a minimal set of equivalent operations.

 This method respects the order of the operations array and does not allow
 reordering of operations that affect relationships.

 @method coalesceOperations
 @for Orbit
 @param {Array} operations
 @returns {Array}
 */
export function coalesceOperations(operations: Operation[]) {
  for (let i = 0, l = operations.length; i < l; i++) {
    let currentOp = operations[i];
    let consecutiveOps = true;

    for (let j = i + 1; j < l; j++) {
      let nextOp = operations[j];

      mergeOps(currentOp, nextOp, consecutiveOps);

      if (currentOp._deleted) {
        break;
      } else if (!nextOp._deleted) {
        consecutiveOps = false;
      }
    }
  }

  return operations.filter(o => !o._deleted);
}

export function recordDiffs(record: Record, updatedRecord: Record): Operation[] {
  const diffs: Operation[] = [];

  if (record && updatedRecord) {
    const recordIdentity = identity(record);

    if (updatedRecord.attributes) {
      Object.keys(updatedRecord.attributes).forEach(attribute => {
        let value = updatedRecord.attributes[attribute];
        if (record.attributes === undefined || !eq(record.attributes[attribute], value)) {
          diffs.push({
            op: 'replaceAttribute',
            record: recordIdentity,
            attribute,
            value
          });
        }
      });
    }

    if (updatedRecord.keys) {
      Object.keys(updatedRecord.keys).forEach(key => {
        let value = updatedRecord.keys[key];
        if (record.keys === undefined || !eq(record.keys[key], value)) {
          diffs.push({
            op: 'replaceKey',
            record: recordIdentity,
            key,
            value
          });
        }
      });
    }

    // TODO - handle relationships
  }

  return diffs;
}
