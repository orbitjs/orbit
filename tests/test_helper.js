var verifyLocalStorageContainsRecord = function(namespace, record) {
  var expected = {};
  expected[record.__id] = record;
  deepEqual(JSON.parse(window.localStorage.getItem(namespace)),
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
