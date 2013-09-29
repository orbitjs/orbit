function verifyLocalStorageContainsRecord(namespace, record) {
  var expected = {};
  expected[record.__id] = record;
  deepEqual(JSON.parse(window.localStorage.getItem(namespace)),
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

window.verifyLocalStorageContainsRecord = verifyLocalStorageContainsRecord;
window.verifyLocalStorageIsEmpty = verifyLocalStorageIsEmpty;
