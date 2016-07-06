import { assert } from './lib/assert';
import { extend } from './lib/objects';
import Query from './query';
import Source from './source';

export default {
  /**
   Mixes the `Fetchable` interface into a source.

   @method extend
   @param {Object} source - Source to extend
   @returns {Object} Extended source
   */
  extend(source) {
    if (source._fetchable === undefined) {
      assert('Fetchable interface can only be applied to a Source', source instanceof Source);
      extend(source, this.interface);
    }
    return source;
  },

  interface: {
    _fetchable: true,

    fetch(queryOrExpression) {
      const query = Query.from(queryOrExpression, this.queryBuilder);

      return this.series('beforeFetch', query)
        .then(() => this._fetch(query))
        .then(result => this.transformed(result))
        .then(result => {
          return this.settle('fetch', query, result)
            .then(() => result);
        })
        .catch(error => {
          return this.settle('fetchFail', query, error)
            .then(() => { throw error; });
        });
    }
  }
};
