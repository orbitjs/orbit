import { toIdentifier } from 'orbit-common/lib/identifiers';

export default {
  addRecord(op) {
    return {
      op: 'add',
      path: [op.record.type, op.record.id],
      value: op.record
    };
  },

  replaceRecord(op) {
    return {
      op: 'replace',
      path: [op.record.type, op.record.id],
      value: op.record
    };
  },

  removeRecord(op) {
    return {
      op: 'remove',
      path: [op.record.type, op.record.id]
    };
  },

  replaceKey(op) {
    return {
      op: 'replace',
      path: [op.record.type, op.record.id, 'keys', op.key],
      value: op.value
    };
  },

  replaceAttribute(op) {
    return {
      op: 'replace',
      path: [op.record.type, op.record.id, 'attributes', op.attribute],
      value: op.value
    };
  },

  addToHasMany(op) {
    return {
      op: 'add',
      path: [op.record.type, op.record.id, 'relationships', op.relationship, 'data', toIdentifier(op.relatedRecord.type, op.relatedRecord.id)],
      value: true
    };
  },

  removeFromHasMany(op) {
    return {
      op: 'remove',
      path: [op.record.type, op.record.id, 'relationships', op.relationship, 'data', toIdentifier(op.relatedRecord.type, op.relatedRecord.id)]
    };
  },

  replaceHasMany(op) {
    let relatedData = {};

    op.relatedRecords.forEach((r) => {
      let identifier = toIdentifier(r.type, r.id);
      relatedData[identifier] = true;
    });

    return {
      op: 'replace',
      path: [op.record.type, op.record.id, 'relationships', op.relationship, 'data'],
      value: relatedData
    };
  },

  replaceHasOne(op) {
    let relatedData;

    if (op.relatedRecord) {
      relatedData = toIdentifier(op.relatedRecord.type, op.relatedRecord.id);
    } else {
      relatedData = null;
    }

    return {
      op: 'replace',
      path: [op.record.type, op.record.id, 'relationships', op.relationship, 'data'],
      value: relatedData
    };
  }
};
