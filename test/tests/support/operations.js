/* globals Promise */
import { isArray } from 'orbit/lib/objects';

function serializeOps(o) {
  return isArray(o) ? o.map(r => serializeOp(r)) : serializeOp(o);
}

function serializeOp(o) {
  let path = o.path;

  if (isArray(path)) {
    path = path.join('/');
  }

  return {
    op: o.op,
    path,
    value: o.value
  };
}

function op(opType, _path, value) {
  let path = _path;
  if (typeof path === 'string') {
    path = path.split('/');
  }
  var operation = { op: opType, path: path };
  if (value !== undefined) { operation.value = value; }
  return operation;
}

var successfulOperation = function(response) {
  return new Promise(function(resolve) {
    resolve(response || ':)');
  });
};

var failedOperation = function(response) {
  return new Promise(function(resolve, reject) {
    reject(response || ':(');
  });
};

export {
  serializeOps,
  serializeOp,
  op,
  successfulOperation,
  failedOperation
};
