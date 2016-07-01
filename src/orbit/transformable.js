import Orbit from './main';
import { extend } from './lib/objects';
import Evented from './evented';
import Transform from './transform';
import TransformLog from './transform/log';

export default {
  /**
   Mixes the `Transformable` interface into a source

   @method extend
   @param {Object} source - Source to extend
   @returns {Object} Extended source
   */
  extend(source) {
    if (source._transformable === undefined) {
      Evented.extend(source);
      extend(source, this.interface);
      source.transformLog = new TransformLog();
    }
    return source;
  },

  interface: {
    _transformable: true,

    transform(transformOrOperations) {
      const transform = Transform.from(transformOrOperations);

      if (this.transformLog.contains(transform.id)) {
        return Orbit.Promise.resolve([]);
      }

      return this._transform(transform)
        .then(result => this.transformed(result));
    },

    transformed(transforms) {
      return transforms
        .reduce((chain, transform) => {
          return chain.then(() => {
            if (this.transformLog.contains(transform.id)) {
              return Orbit.Promise.resolve();
            }

            this.transformLog.append(transform.id);
            return this.settle('transform', transform);
          });
        }, Orbit.Promise.resolve())
        .then(() => transforms);
    }
  }
};
