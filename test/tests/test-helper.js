var verifyLocalStorageContainsRecord = function(namespace, type, record, ignoreFields) {
  var expected = {};
  expected[record.__id] = record;

  var actual = JSON.parse(window.localStorage.getItem(namespace));
  if (type) actual = actual[type];

  if (ignoreFields) {
    for (var i = 0, l = ignoreFields.length, field; i < l; i++) {
      field = ignoreFields[i];
      actual[record.__id][field] = record[field];
    }
  }

  deepEqual(actual,
            expected,
            'data in local storage matches expectations');
};

var verifyLocalStorageIsEmpty = function(namespace) {
  var contents = JSON.parse(window.localStorage.getItem(namespace));
  if (contents === null) {
    equal(contents, null, 'local storage should still be empty');
  } else {
    deepEqual(contents, {}, 'local storage should still be empty');
  }
};

export { verifyLocalStorageContainsRecord, verifyLocalStorageIsEmpty };
