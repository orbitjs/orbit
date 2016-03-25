import Orbit from './main';
import Evented from './evented';
import { extend } from './lib/objects';
import Transform from './transform';
import TransformLog from './transform/log';

export default {
  /**
   Mixes the `Transformable` interface into a source

   @method extend
   @param {Source} source Source to extend
   @returns {Source} Extended source
   */
  extend(source) {
    if (source._transformable === undefined) {
      source.transformLog = new TransformLog();

      extend(source, this.interface);
    }
    return source;
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
