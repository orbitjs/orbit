import Orbit from './main';
import Transformable from './transformable';
import Transform from './transform';
import { extend } from './lib/objects';

export default {
  /**
   Mixes the `Updatable` interface into an object

   @method extend
   @param {Object} object Object to extend
   @returns {Object} Extended object
   */
  extend(object) {
    if (object._updatable === undefined) {
      Transformable.extend(object);
      extend(object, this.interface);
    }
    return object;
  },

  interface: {
    _updatable: true,

    update(transformOrOperations) {
      const transform = Transform.from(transformOrOperations, this.transformBuilder);

      if (this.transformLog.contains(transform.id)) {
        return Orbit.Promise.resolve();
      }

      return this.series('beforeUpdate', transform)
        .then(() => this._update(transform))
        .then((result) => {
          return result.reduce((chain, t) => {
            return chain.then(() => this.transformed(Transform.from(t)));
          }, Orbit.Promise.resolve())
            .then(() => result);
        })
        .then((result) => {
          return this.settle('update', transform, result)
            .then(() => result);
        })
        .catch((error) => {
          return this.settle('updateFail', transform, error)
            .then(() => { throw error; });
        });
    }
  }
};
