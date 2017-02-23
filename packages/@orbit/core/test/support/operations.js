/* globals Promise */
import { isArray } from '../../src/utils/objects';

export function serializeOps(o) {
  return isArray(o) ? o.map(r => serializeOp(r)) : serializeOp(o);
}

export function serializeOp(o) {
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

export function op(opType, _path, value) {
  let path = _path;
  if (typeof path === 'string') {
    path = path.split('/');
  }
  var operation = { op: opType, path: path };
  if (value !== undefined) { operation.value = value; }
  return operation;
}

export function successfulOperation(response) {
  return new Promise(function(resolve) {
    resolve(response || ':)');
  });
}

export function failedOperation(response) {
  return new Promise(function(resolve, reject) {
    reject(response || ':(');
  });
}
