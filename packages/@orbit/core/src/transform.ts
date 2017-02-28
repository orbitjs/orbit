/* eslint-disable valid-jsdoc */
import { Operation } from './operation';
import { isArray, toArray, uuid } from '@orbit/utils';

export type TransformOrOperations = Transform | Operation | Operation[];

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

  static from(transformOrOperations: TransformOrOperations, id?: string): Transform {
    if (transformOrOperations instanceof Transform) {
      return transformOrOperations;
    } else if (isArray(transformOrOperations)) {
      return new Transform(<Operation[]>transformOrOperations, id);
    } else {
      return new Transform([<Operation>transformOrOperations], id);
    }
  }
}
