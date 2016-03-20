export default {
  addRecord(record) {
    this.operations.push({ op: 'addRecord', record });
    return this;
  },

  replaceRecord(record) {
    this.operations.push({ op: 'replaceRecord', record });
    return this;
  },

  removeRecord(record) {
    this.operations.push({ op: 'removeRecord', record });
    return this;
  },

  replaceKey(record, key, value) {
    this.operations.push({ op: 'replaceKey', record, key, value });
    return this;
  },

  replaceAttribute(record, attribute, value) {
    this.operations.push({ op: 'replaceAttribute', record, attribute, value });
    return this;
  },

  addToHasMany(record, relationship, relatedRecord) {
    this.operations.push({ op: 'addToHasMany', record, relationship, relatedRecord });
    return this;
  },

  removeFromHasMany(record, relationship, relatedRecord) {
    this.operations.push({ op: 'removeFromHasMany', record, relationship, relatedRecord });
    return this;
  },

  replaceHasMany(record, relationship, relatedRecords) {
    this.operations.push({ op: 'replaceHasMany', record, relationship, relatedRecords });
    return this;
  },

  replaceHasOne(record, relationship, relatedRecord) {
    this.operations.push({ op: 'replaceHasOne', record, relationship, relatedRecord });
    return this;
  }
};
