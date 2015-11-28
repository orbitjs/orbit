import { isArray } from 'orbit/lib/objects';
import Operation from 'orbit/operation';

function serializeOps(o) {
  return isArray(o) ? o.map( r => serializeOp(r) ) : serializeOp(o);
}

function serializeOp(o) {
  var operation;

  if (o instanceof Operation) {
    operation = o;
  } else {
    operation = op(o.op, o.path, o.value);
  }

  return operation.serialize();
}

function op(opType, path, value) {
  var operation = new Operation({ op: opType, path: path });
  if (value !== undefined) { operation.value = value; }
  return operation;
}

var successfulOperation = function(response) {
  return new Promise(function(resolve, reject) {
    resolve(response || ':)');
  });
};

var failedOperation = function(response) {
  return new Promise(function(resolve, reject) {
    reject(response || ':(');
  });
};

var equalOps = function(result, expected, msg) {
  deepEqual(serializeOps(result),
            serializeOps(expected),
            msg);
};

export {
  serializeOps,
  serializeOp,
  op,
  successfulOperation,
  failedOperation,
  equalOps
};
