import Orbit from './main';
import Evented from './evented';
import { extend } from './lib/objects';
import Query from './query';

export default {
  /**
   Mixes the `Queryable` interface into an object

   @method extend
   @param {Object} object Object to extend
   @returns {Object} Extended object
   */
  extend(object) {
    if (object._queryable === undefined) {
      Evented.extend(object);
      extend(object, this.interface);
    }
    return object;
  },

  interface: {
    _queryable: true,

    query(queryOrExpression) {
      const query = Query.from(queryOrExpression, this.queryBuilder);

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
