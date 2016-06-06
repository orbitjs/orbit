import Orbit from './main';
import Transform from './transform';
import { extend } from './lib/objects';

export default {
  /**
   Mixes the `Updatable` interface into an source

   @method extend
   @param {Source} source Source to extend
   @returns {Source} Extended source
   */
  extend(source) {
    if (source._updatable === undefined) {
      extend(source, this.interface);
    }
    return source;
  },

  interface: {
    _updatable: true,

    update(transformOrOperations) {
      const transform = Transform.from(transformOrOperations);

      if (this.transformLog.contains(transform.id)) {
        return Orbit.Promise.resolve([]);
      }

      return this.series('beforeUpdate', transform)
        .then(() => this._update(transform))
        .then(result => this.transformed(result))
        .then(result => {
          return this.settle('update', transform, result)
            .then(() => result);
        })
        .catch(error => {
          return this.settle('updateFail', transform, error)
            .then(() => { throw error; });
        });
    }
  }
};
