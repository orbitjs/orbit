import Orbit from './main';
import Evented from './evented';
import { extend } from './lib/objects';
import Transform from './transform';
import TransformLog from './transform/log';

export default {
  /**
   Mixes the `Transformable` interface into an object

   @method extend
   @param {Object} object Object to extend
   @returns {Object} Extended object
   */
  extend(object) {
    if (object._transformable === undefined) {
      object.transformLog = new TransformLog();

      extend(object, this.interface);
    }
    return object;
  },

  interface: {
    _transformable: true,

    transform(transformOrOperations) {
      const transform = Transform.from(transformOrOperations, this.transformBuilder);

      if (this.transformLog.contains(transform.id)) {
        return Orbit.Promise.resolve([]);
      }

      return this._transform(transform)
        .then(result => this.transformed(result));
    }
  }
};
