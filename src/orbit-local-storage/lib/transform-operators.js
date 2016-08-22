import { toIdentifier } from 'orbit/lib/identifiers';

export default {
  addRecord(source, operation) {
    source.putRecord(operation.record);
  },

  replaceRecord(source, operation) {
    source.putRecord(operation.record);
  },

  removeRecord(source, operation) {
    source.removeRecord(operation.record);
  },

  replaceKey(source, operation) {
    let record = source.getRecord(operation.record) || {
      type: operation.record.type,
      id: operation.record.id
    };
    record.keys = record.keys || {};
    record.keys[operation.key] = operation.value;
    source.putRecord(record);
  },

  replaceAttribute(source, operation) {
    let record = source.getRecord(operation.record) || {
      type: operation.record.type,
      id: operation.record.id
    };
    record.attributes = record.attributes || {};
    record.attributes[operation.attribute] = operation.value;
    source.putRecord(record);
  },

  addToHasMany(source, operation) {
    let record = source.getRecord(operation.record) || {
      type: operation.record.type,
      id: operation.record.id
    };
    record.relationships = record.relationships || {};
    record.relationships[operation.relationship] = record.relationships[operation.relationship] || {};
    record.relationships[operation.relationship].data = record.relationships[operation.relationship].data || {};
    record.relationships[operation.relationship].data[toIdentifier(operation.relatedRecord)] = true;
    source.putRecord(record);
  },

  removeFromHasMany(source, operation) {
    let record = source.getRecord(operation.record);
    if (record &&
        record.relationships &&
        record.relationships[operation.relationship] &&
        record.relationships[operation.relationship].data &&
        record.relationships[operation.relationship].data[toIdentifier(operation.relatedRecord)]
    ) {
      delete record.relationships[operation.relationship].data[toIdentifier(operation.relatedRecord)];
      source.putRecord(record);
    }
  },

  replaceHasMany(source, operation) {
    let record = source.getRecord(operation.record) || {
      type: operation.record.type,
      id: operation.record.id
    };
    record.relationships = record.relationships || {};
    record.relationships[operation.relationship] = record.relationships[operation.relationship] || {};
    record.relationships[operation.relationship].data = {};
    operation.relatedRecords.forEach(relatedRecord => {
      record.relationships[operation.relationship].data[toIdentifier(relatedRecord)] = true;
    });
    source.putRecord(record);
  },

  replaceHasOne(source, operation) {
    let record = source.getRecord(operation.record) || {
      type: operation.record.type,
      id: operation.record.id
    };
    record.relationships = record.relationships || {};
    record.relationships[operation.relationship] = record.relationships[operation.relationship] || {};
    record.relationships[operation.relationship].data = operation.relatedRecord ? toIdentifier(operation.relatedRecord) : null;
    source.putRecord(record);
  }
};
