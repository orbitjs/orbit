import OrbitTransformBuilder from 'orbit/transform/builder';

export default class TransformBuilder extends OrbitTransformBuilder {
  addRecord(record) {
    this.transform.operations.push({ op: 'addRecord', record });
  }

  replaceRecord(record) {
    this.transform.operations.push({ op: 'replaceRecord', record });
  }

  removeRecord(record) {
    this.transform.operations.push({ op: 'removeRecord', record });
  }

  replaceKey(record, key, value) {
    this.transform.operations.push({ op: 'replaceKey', record, key, value });
  }

  replaceAttribute(record, attribute, value) {
    this.transform.operations.push({ op: 'replaceAttribute', record, attribute, value });
  }

  addToHasMany(record, relationship, relatedRecord) {
    this.transform.operations.push({ op: 'addToHasMany', record, relationship, relatedRecord });
  }

  removeFromHasMany(record, relationship, relatedRecord) {
    this.transform.operations.push({ op: 'removeFromHasMany', record, relationship, relatedRecord });
  }

  replaceHasMany(record, relationship, relatedRecords) {
    this.transform.operations.push({ op: 'replaceHasMany', record, relationship, relatedRecords });
  }

  replaceHasOne(record, relationship, relatedRecord) {
    this.transform.operations.push({ op: 'replaceHasOne', record, relationship, relatedRecord });
  }
}
