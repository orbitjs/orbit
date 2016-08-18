function getRecord(source, record) {
  let recordKey = [source.namespace, record.type, record.id].join(source.delimiter);

  return JSON.parse(self.localStorage.getItem(recordKey));
}

export function verifyLocalStorageContainsRecord(source, record, ignoreFields) {
  let actual = getRecord(source, record);

  if (ignoreFields) {
    for (let i = 0, l = ignoreFields.length, field; i < l; i++) {
      field = ignoreFields[i];
      actual[record.id][field] = record[field];
    }
  }

  deepEqual(actual, record, 'local storage contains record');
}

export function verifyLocalStorageDoesNotContainRecord(source, record) {
  let actual = getRecord(source, record);

  equal(actual, null, 'local storage does not contain record');
}

export function verifyLocalStorageIsEmpty(source) {
  let isEmpty = true;
  for (let key in self.localStorage) {
    if (key.indexOf(source.namespace) === 0) {
      isEmpty = false;
      break;
    }
  }
  ok(isEmpty, 'local storage does not contain records for source');
}
