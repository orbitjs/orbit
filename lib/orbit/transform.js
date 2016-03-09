import { toArray, Class } from './lib/objects';
import { uuid } from './lib/uuid';
import { TransformBuilderNotRegisteredException } from './lib/exceptions';

/**
 Transforms represent a set of operations that are applied against a
 source. After a transform has been applied, it should be assigned the
 `result`, a `TransformResult` that represents the result of the transform.

 Transforms are automatically assigned a UUID `id`.

 @class Transform
 @namespace Orbit
 @param {Array}     [operations] Operations to apply
 @param {Object}    [options]
 @param {String}    [options.id] Unique id for this transform (will be assigned a uuid by default)
 @constructor
 */
export default class Transform {
  constructor(ops, _options) {
    this.operations = toArray(ops);

    let options = _options || {};

    this.id = options.id || uuid();
  }

  isEmpty() {
    return this.operations.length === 0;
  }
}

Transform.from = function(transformOrOperations, transformBuilder) {
  if (transformOrOperations instanceof Transform) {
    return transformOrOperations;
  } else if (typeof transformOrOperations === 'function') {
    if (transformBuilder) {
      return transformBuilder.build(transformOrOperations);
    } else {
      throw new TransformBuilderNotRegisteredException();
    }
  } else {
    return new Transform(transformOrOperations);
  }
};
