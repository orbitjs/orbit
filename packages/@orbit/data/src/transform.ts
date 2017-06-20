/* eslint-disable valid-jsdoc */
import Orbit from './main';
import { Operation } from './operation';
import { isArray, toArray } from '@orbit/utils';
import TransformBuilder from './transform-builder';

export type TransformBuilderFunc = (TransformBuilder) => Operation[];
export type TransformOrOperations = Transform | Operation | Operation[] | TransformBuilderFunc;

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
  options: any;

  constructor(operations: Operation[], options?: object, id: string = Orbit.uuid()) {
    this.operations = operations;
    this.options = options;
    this.id = id;
  }

  static from(transformOrOperations: TransformOrOperations, options?: object, id?: string, builder?: TransformBuilder): Transform {
    if (transformOrOperations instanceof Transform) {
      if (options && options !== transformOrOperations.options ||
          id && id !== transformOrOperations.id) {
        return new Transform(transformOrOperations.operations, options || transformOrOperations.options, id);
      } else {
        return transformOrOperations;
      }
    } else if (isArray(transformOrOperations)) {
      return new Transform(<Operation[]>transformOrOperations, options, id);
    } else if (typeof transformOrOperations === 'function') {
      return Transform.from(transformOrOperations(builder), options, id);
     } else {
      return new Transform([<Operation>transformOrOperations], options, id);
    }
  }
}
