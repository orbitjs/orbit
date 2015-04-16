function verifyLocalStorageContainsRecord(namespace, type, id, record, ignoreFields) {
  let recordKey = [namespace, type, id].join('/');

  let actual = JSON.parse(window.localStorage.getItem(recordKey));

  if (ignoreFields) {
    for (let i = 0, l = ignoreFields.length, field; i < l; i++) {
      field = ignoreFields[i];
      actual[id][field] = record[field];
    }
  }

  deepEqual(actual,
            expected,
            'data in local storage matches expectations');
}

function verifyLocalStorageIsEmpty(namespace) {
  var contents = JSON.parse(window.localStorage.getItem(namespace));
  if (contents === null) {
    equal(contents, null, 'local storage should still be empty');
  } else {
    deepEqual(contents, {}, 'local storage should still be empty');
  }
}

export {
  verifyLocalStorageIsEmpty,
  verifyLocalStorageContainsRecord
};
