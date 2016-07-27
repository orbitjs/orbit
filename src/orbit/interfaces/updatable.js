import Orbit from '../main';
import Source from '../source';
import Transform from '../transform';
import { assert } from '../lib/assert';
import { extend } from '../lib/objects';

export default {
  /**
   Mixes the `Updatable` interface into a source.

   @method extend
   @param {Object} source - Source to extend
   @returns {Object} Extended source
   */
  extend(source) {
    if (source._updatable === undefined) {
      assert('Updatable interface can only be applied to a Source', source instanceof Source);
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
        .then(() => this._transformed([transform]))
        .then(() => this.settle('update', transform))
        .catch(error => {
          return this.settle('updateFail', transform, error)
            .then(() => { throw error; });
        });
    }
  }
};
