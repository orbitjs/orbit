import { toIdentifier, parseIdentifier } from '../lib/identifiers';
import { eq } from 'orbit/lib/eq';


const InverseTransforms = {
  addRecord(doc, op) {
    const current = doc.get([op.record.type, op.record.id]);

    if (current === undefined) {
      return {
        op: 'removeRecord',
        record: { type: op.record.type, id: op.record.id }
      };
    } else if (eq(current, op.record)) {
      return;
    } else {
      return {
        op: 'replaceRecord',
        record: current
      };
    }
  },

  replaceRecord(doc, op) {
    return InverseTransforms.addRecord(doc, op);
  },

  removeRecord(doc, op) {
    const current = doc.get([op.record.type, op.record.id]);

    if (current !== undefined) {
      return {
        op: 'replaceRecord',
        record: current
      };
    }
  },

  replaceKey(doc, op) {
    const current = doc.get([op.record.type, op.record.id, 'keys', op.key]);

    if (!eq(current, op.value)) {
      return {
        op: 'replaceKey',
        record: { type: op.record.type, id: op.record.id },
        key: op.key,
        value: current
      };
    }
  },

  replaceAttribute(doc, op) {
    const { type, id } = op.record;
    const { attribute } = op;
    const current = doc.get([type, id, 'attributes', attribute]);

    if (!eq(current, op.value)) {
      return {
        op: 'replaceAttribute',
        record: { type, id },
        attribute,
        value: current
      };
    }
  },

  addToHasMany(doc, op) {
    const { type, id } = op.record;
    const { relationship, relatedRecord } = op;
    const current = doc.get([type, id, 'relationships', relationship, 'data', toIdentifier(relatedRecord.type, relatedRecord.id)]);

    if (current === undefined) {
      return {
        op: 'removeFromHasMany',
        record: { type, id },
        relationship,
        relatedRecord
      };
    }
  },

  removeFromHasMany(doc, op) {
    const { type, id } = op.record;
    const { relationship, relatedRecord } = op;
    const current = doc.get([type, id, 'relationships', relationship, 'data', toIdentifier(relatedRecord.type, relatedRecord.id)]);

    if (current) {
      return {
        op: 'addToHasMany',
        record: { type, id },
        relationship,
        relatedRecord
      };
    }
  },

  replaceHasMany(doc, op) {
    const { type, id } = op.record;
    const { relationship } = op;
    const currentValue = doc.get([type, id, 'relationships', relationship, 'data']);
    let currentRecords;
    if (currentValue) {
      currentRecords = Object.keys(currentValue).map(identifier => parseIdentifier(identifier));
    } else {
      currentRecords = [];
    }

    if (!eq(currentRecords, op.relatedRecords)) {
      return {
        op: 'replaceHasMany',
        record: { type, id },
        relationship,
        relatedRecords: currentRecords
      };
    }
  },

  replaceHasOne(doc, op) {
    const { type, id } = op.record;
    const { relationship } = op;
    const currentValue = doc.get([type, id, 'relationships', relationship, 'data']);
    const currentRecord = currentValue ? parseIdentifier(currentValue) : currentValue;

    if (!eq(currentRecord, op.relatedRecord)) {
      return {
        op: 'replaceHasOne',
        record: { type, id },
        relationship: relationship,
        relatedRecord: currentRecord
      };
    }
  }
};

export default InverseTransforms;
