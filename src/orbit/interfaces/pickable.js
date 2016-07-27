import Orbit from '../main';
import { assert } from '../lib/assert';
import { extend } from '../lib/objects';
import Source from '../source';

export default {
  /**
   Mixes the `Pickable` interface into a source.

   The `Pickable` interface adds the `pick` method to a source.
   `pick` accepts a transform as an argument and applies it to the source.

   @method extend
   @param {Object} source - Source to extend
   @returns {Object} Extended source
   */
  extend(source) {
    if (source._pickable === undefined) {
      assert('Pickable interface can only be applied to a Source', source instanceof Source);
      extend(source, this.interface);
    }
    return source;
  },

  interface: {
    _pickable: true,

    pick(transform) {
      if (this.transformLog.contains(transform.id)) {
        return Orbit.Promise.resolve();
      }

      return this._pick(transform)
        .then(() => this._transformed([transform]));
    }
  }
};
