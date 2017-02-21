/* eslint-disable valid-jsdoc */
import { Operation } from './operation';
import { toArray } from './lib/objects';
import { uuid } from './lib/uuid';

/**
 Transforms represent a set of operations that are applied to mutate a
 source.

 Transforms are automatically assigned a UUID `id`.

 @class Transform
 @param {Array}     [operations] Operations to apply
 @param {String}    [id] Unique id for this transform (will be assigned a uuid by default)
 @constructor
 */
export default class Transform {
  id: string;
  operations: Operation[];

  constructor(operations: Operation[], id: string = uuid()) {
    this.operations = operations;
    this.id = id;
  }

  static from(transformOrOperations: Transform | Operation[], id?: string): Transform {
    if (transformOrOperations instanceof Transform) {
      return transformOrOperations;
    } else {
      return new Transform(transformOrOperations, id);
    }
  }
}
