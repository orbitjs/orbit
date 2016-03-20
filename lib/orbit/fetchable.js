import Orbit from './main';
import Transformable from './transformable';
import Query from './query';
import Transform from './transform';
import { extend } from './lib/objects';

export default {
  /**
   Mixes the `Fetchable` interface into an object

   @method extend
   @param {Object} object Object to extend
   @returns {Object} Extended object
   */
  extend(object) {
    if (object._fetchable === undefined) {
      Transformable.extend(object);
      extend(object, this.interface);
    }
    return object;
  },

  interface: {
    _fetchable: true,

    fetch(queryOrExpression) {
      const query = Query.from(queryOrExpression, this.queryBuilder);

      return this.series('beforeFetch', query)
        .then(() => {
          const result = this._fetch(query);
          return Orbit.Promise.resolve(result);
        })
        .then((result) => {
          return result.reduce((chain, t) => {
            return chain.then(() => this.transformed(Transform.from(t)));
          }, Orbit.Promise.resolve())
            .then(() => result);
        })
        .then((result) => {
          return this.settle('fetch', query, result)
            .then(() => result);
        })
        .catch((error) => {
          return this.settle('fetchFail', query, error)
            .then(() => { throw error; });
        });
    }
  }
};
