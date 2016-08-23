/* eslint-disable valid-jsdoc */
import { toArray } from './lib/objects';
import { uuid } from './lib/uuid';

/**
 Transforms represent a set of operations that are applied to mutate a
 source.

 Transforms are automatically assigned a UUID `id`.

 @class Transform
 @namespace Orbit
 @param {Array}     [operations] Operations to apply
 @param {Object}    [options]
 @param {String}    [options.id] Unique id for this transform (will be assigned a uuid by default)
 @constructor
 */
export default class Transform {
  constructor(ops, options = {}) {
    this.operations = toArray(ops);
    this.id = options.id || uuid();
  }

  isEmpty() {
    return this.operations.length === 0;
  }
}

Transform.from = function(transformOrOperations) {
  if (transformOrOperations instanceof Transform) {
    return transformOrOperations;
  } else {
    return new Transform(transformOrOperations);
  }
};
