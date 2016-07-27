import { assert } from '../lib/assert';
import { extend } from '../lib/objects';
import Source from '../source';

export default {
  /**
   Mixes the `Pullable` interface into a source.

   The `Pullable` interface adds a single method to a Source: `pull`.
   `pull` accepts a query as an argument and returns an array of
   transforms that result from processing the query.

   @method extend
   @param {Object} source - Source to extend
   @returns {Object} Extended source
   */
  extend(source) {
    if (source._pullable === undefined) {
      assert('Pullable interface can only be applied to a Source', source instanceof Source);
      extend(source, this.interface);
    }
    return source;
  },

  interface: {
    _pullable: true,

    pull(query) {
      return this.series('beforePull', query)
        .then(() => this._pull(query))
        .then(result => this._transformed(result))
        .then(result => {
          return this.settle('pull', query, result)
            .then(() => result);
        })
        .catch(error => {
          return this.settle('pullFail', query, error)
            .then(() => { throw error; });
        });
    }
  }
};
