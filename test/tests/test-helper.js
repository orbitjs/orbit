import Operation from 'orbit/operation';
import { isArray } from 'orbit/lib/objects';
import { on } from 'rsvp';

on('error', function(reason){
  console.log(reason);
  console.error(reason.message, reason.stack);
});

var verifyLocalStorageContainsRecord = function(namespace, type, id, record, ignoreFields) {
  var expected = {};
  expected[id] = record;

  var actual = JSON.parse(window.localStorage.getItem(namespace));
  if (type) actual = actual[type];

  if (ignoreFields) {
    for (var i = 0, l = ignoreFields.length, field; i < l; i++) {
      field = ignoreFields[i];
      actual[id][field] = record[field];
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

var equalOps = function(result, expected, msg) {
  var serializedResult;
  var serializedExpected;

  if (isArray(result)) {
    serializedResult = result.map(function(r) {
      return serializeOp(r);
    });
  } else {
    serializedResult = serializeOp(result);
  }

  if (isArray(expected)) {
    serializedExpected = expected.map(function(e) {
      return serializeOp(e);
    });
  } else {
    serializedExpected = serializeOp(expected);
  }

  deepEqual(serializedResult,
            serializedExpected,
            msg);
};

function serializeOp(o) {
  var operation;

  if (o instanceof Operation) {
    operation = o;
  } else {
    operation = op(o.op, o.path, o.value);
  }

  return operation.serialize();
}

function op(opType, path, value){
  var operation = new Operation({op: opType, path: path});
  if (value !== undefined) operation.value = value;
  return operation;
}

export { verifyLocalStorageContainsRecord, verifyLocalStorageIsEmpty, equalOps, op };
