import Orbit from '@orbit/core';

function getRecord(source, record) {
  let recordKey = [source.namespace, record.type, record.id].join(source.delimiter);

  return JSON.parse(Orbit.globals.localStorage.getItem(recordKey));
}

export function verifyLocalStorageContainsRecord(assert, source, record, ignoreFields?) {
  let actual = getRecord(source, record);

  if (ignoreFields) {
    for (let i = 0, l = ignoreFields.length, field; i < l; i++) {
      field = ignoreFields[i];
      actual[record.id][field] = record[field];
    }
  }

  assert.deepEqual(actual, record, 'local storage contains record');
}

export function verifyLocalStorageDoesNotContainRecord(assert, source, record) {
  let actual = getRecord(source, record);

  assert.equal(actual, null, 'local storage does not contain record');
}

export function verifyLocalStorageIsEmpty(assert, source) {
  let isEmpty = true;
  for (let key in Orbit.globals.localStorage) {
    if (key.indexOf(source.namespace) === 0) {
      isEmpty = false;
      break;
    }
  }
  assert.ok(isEmpty, 'local storage does not contain records for source');
}
