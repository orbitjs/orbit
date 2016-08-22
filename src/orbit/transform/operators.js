export function addRecord(record) {
  return { op: 'addRecord', record };
}

export function replaceRecord(record) {
  return { op: 'replaceRecord', record };
}

export function removeRecord(record) {
  return { op: 'removeRecord', record };
}

export function replaceKey(record, key, value) {
  return { op: 'replaceKey', record, key, value };
}

export function replaceAttribute(record, attribute, value) {
  return { op: 'replaceAttribute', record, attribute, value };
}

export function addToHasMany(record, relationship, relatedRecord) {
  return { op: 'addToHasMany', record, relationship, relatedRecord };
}

export function removeFromHasMany(record, relationship, relatedRecord) {
  return { op: 'removeFromHasMany', record, relationship, relatedRecord };
}

export function replaceHasMany(record, relationship, relatedRecords) {
  return { op: 'replaceHasMany', record, relationship, relatedRecords };
}

export function replaceHasOne(record, relationship, relatedRecord) {
  return { op: 'replaceHasOne', record, relationship, relatedRecord };
}
