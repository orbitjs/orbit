import Orbit from '../main';
import Source from '../source';
import Transform from '../transform';
import { assert } from '../lib/assert';
import { extend } from '../lib/objects';

export default {
  /**
   Mixes the `Pushable` interface into a source.

   The `Pushable` interface adds a single method to a Source: `push`.
   `push` accepts a transform as an argument and returns an array of
   transforms that are applied as a result.

   @method extend
   @param {Object} source - Source to extend
   @returns {Object} Extended source
   */
  extend(source) {
    if (source._pushable === undefined) {
      assert('Pushable interface can only be applied to a Source', source instanceof Source);
      extend(source, this.interface);
    }
    return source;
  },

  interface: {
    _pushable: true,

    push(transformOrOperations) {
      const transform = Transform.from(transformOrOperations);

      if (this.transformLog.contains(transform.id)) {
        return Orbit.Promise.resolve([]);
      }

      return this.series('beforePush', transform)
        .then(() => this._push(transform))
        .then(result => this._transformed(result))
        .then(result => {
          return this.settle('push', transform, result)
            .then(() => result);
        })
        .catch(error => {
          return this.settle('pushFail', transform, error)
            .then(() => { throw error; });
        });
    }
  }
};
