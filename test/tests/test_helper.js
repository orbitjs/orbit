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

var verifyLocalForageContainsRecord = function(namespace, type, record, ignoreFields) {
  var expected = {};
  expected[record.__id] = record;

  stop();
  window.localforage.getItem(namespace).then(function(obj){
    var actual;
    if (type) actual = obj[type];
    if (ignoreFields) {
      for (var i = 0, l = ignoreFields.length, field; i < l; i++) {
        field = ignoreFields[i];
        actual[record.__id][field] = record[field];
      }
    }
    deepEqual(actual,
              expected,
              'data in local forage matches expectations');
    start();
  });

};

var verifyLocalForageIsEmpty = function(namespace) {
  stop();
  window.localforage.getItem(namespace).then(function(contents){
    if (contents === null) {
      equal(contents, null, 'local forage should still be empty');
    } else {
      deepEqual(contents, {}, 'local forage should still be empty');
    }
    start();
  });

};

export { verifyLocalStorageContainsRecord, verifyLocalStorageIsEmpty, verifyLocalForageContainsRecord, verifyLocalForageIsEmpty };
