import Orbit from './main';
import Source from './source';
import Transform from './transform';
import Transformable from './transformable';
import { assert } from './lib/assert';
import { extend } from './lib/objects';

export default {
  /**
   Mixes the `Updatable` interface into a source

   @method extend
   @param {Object} source - Source to extend
   @returns {Object} Extended source
   */
  extend(source) {
    if (source._updatable === undefined) {
      assert('Updatable interface can only be applied to a Source', source instanceof Source);
      Transformable.extend(source);
      extend(source, this.interface);
    }
    return source;
  },

  interface: {
    _updatable: true,

    update(transformOrOperations) {
      const requestedTransform = Transform.from(transformOrOperations);
      let appliedTransforms;

      if (this.transformLog.contains(requestedTransform.id)) {
        return Orbit.Promise.resolve([]);
      }

      return this.series('beforeUpdate', requestedTransform)
        .then(() => this.transform(requestedTransform))
        .then(transforms => {
          appliedTransforms = transforms;
          return this.settle('update', requestedTransform, appliedTransforms);
        })
        .then(() => appliedTransforms)
        .catch(error => {
          return this.settle('updateFail', requestedTransform, error)
            .then(() => { throw error; });
        });
    }
  }
};
