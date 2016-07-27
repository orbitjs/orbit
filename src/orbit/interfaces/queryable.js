import Orbit from '../main';
import { assert } from '../lib/assert';
import { extend } from '../lib/objects';
import Query from '../query';
import Source from '../source';

export default {
  /**
   Mixes the `Queryable` interface into a source

   @method extend
   @param {Object} source - Source to extend
   @returns {Object} Extended source
   */
  extend(source) {
    if (source._queryable === undefined) {
      assert('Queryable interface can only be applied to a Source', source instanceof Source);
      extend(source, this.interface);
    }
    return source;
  },

  interface: {
    _queryable: true,

    query(queryOrExpression) {
      const query = Query.from(queryOrExpression);

      return this.series('beforeQuery', query)
        .then(() => {
          const result = this._query(query);
          return Orbit.Promise.resolve(result);
        })
        .then((result) => {
          return this.settle('query', query, result)
            .then(() => result);
        })
        .catch((error) => {
          return this.settle('queryFail', query, error)
            .then(() => { throw error; });
        });
    }
  }
};
