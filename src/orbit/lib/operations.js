/* eslint-disable valid-jsdoc */
import { eq } from './eq';
import { identity, eqIdentity, toIdentifier } from './identifiers';

function mergeOps(superceded, superceding, consecutiveOps) {
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
            delete superceded.relaetdRecords;
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

function isReplaceFieldOp(op) {
  return (op === 'replaceAttribute' ||
          op === 'replaceHasOne' ||
          op === 'replaceHasMany');
}

function replaceRecordAttribute(record, attribute, value) {
  record.attributes = record.attributes || {};
  record.attributes[attribute] = value;
}

function replaceRecordHasOne(record, relationship, relatedRecord) {
  record.relationships = record.relationships || {};
  record.relationships[relationship] = record.relationships[relationship] || {};
  record.relationships[relationship].data = relatedRecord ? toIdentifier(relatedRecord) : null;
}

function replaceRecordHasMany(record, relationship, relatedRecords) {
  record.relationships = record.relationships || {};
  record.relationships[relationship] = record.relationships[relationship] || {};
  record.relationships[relationship].data = {};
  relatedRecords.forEach(r => {
    record.relationships[relationship].data[toIdentifier(r)] = true;
  });
}

function addToHasMany(record, relationship, relatedRecord) {
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
export function coalesceOperations(operations) {
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

export function recordDiffs(record, updatedRecord) {
  const diffs = [];

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
