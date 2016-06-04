import Orbit from './main';
import { extend } from './lib/objects';
import Query from './query';

export default {
  /**
   Mixes the `Queryable` interface into an source

   @method extend
   @param {Source} source Source to extend
   @returns {Source} Extended source
   */
  extend(source) {
    if (source._queryable === undefined) {
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
