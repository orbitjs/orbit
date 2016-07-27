import Orbit from '../main';
import { assert } from '../lib/assert';
import { extend } from '../lib/objects';
import Transform from '../transform';
import Source from '../source';

export default {
  /**
   Mixes the `Transformable` interface into a source

   @method extend
   @param {Object} source - Source to extend
   @returns {Object} Extended source
   */
  extend(source) {
    if (source._transformable === undefined) {
      assert('Transformable interface can only be applied to a Source', source instanceof Source);
      extend(source, this.interface);
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
        .then(() => this._transformed([transform]));
    }
  }
};
