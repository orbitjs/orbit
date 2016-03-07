import Orbit from './main';
import Evented from './evented';
import { extend } from './lib/objects';
import ActionQueue from './action-queue';
import Transform from './transform';
import TransformLog from './transform-log';
import { assert } from './lib/assert';
import { deprecate } from './lib/deprecate';
import { TransformBuilderNotRegisteredException } from './lib/exceptions';

export default {
  /**
   Mixes the `Transformable` interface into an object

   @method extend
   @param {Object} object Object to extend
   @returns {Object} Extended object
   */
  extend(object) {
    if (object._transformable === undefined) {
      Evented.extend(object);

      object._transformLog = new TransformLog();

      extend(object, this.interface);
    }
    return object;
  },

  interface: {
    _transformable: true,

    transformed(transformOrOperations) {
      const transform = Transform.from(transformOrOperations);
      // console.log(`${this.id}:transformed`, transform.id);
      this._transformLog.append(transform.id);
      return this.emit('transform', transform);
    },

    transform(_transform) {
      let transform = _transform;

      if (typeof transform === 'function') {
        if (this.transformBuilder) {
          transform = this.transformBuilder.build(transform);
        } else {
          throw new TransformBuilderNotRegisteredException();
        }
      }

      if (transform instanceof Transform) {
        // Do not reapply transforms that have been applied
        if (this.contains(transform)) { return; }
      } else {
        // If a Transform was not passed in, create a new one from the arguments
        transform = new Transform(transform);
      }
      // console.log(`${this.id}:transform`, transform.id);

      return Orbit.Promise.resolve(this._transform(transform));
    },

    contains(transform) {
      return this._transformLog.contains(transform.id);
    },

    clearTransformLog() {
      this._transformLog.clear();
    }
  }
};
