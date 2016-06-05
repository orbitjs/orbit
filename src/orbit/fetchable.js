import Query from './query';
import { extend } from './lib/objects';

export default {
  /**
   Mixes the `Fetchable` interface into an source

   @method extend
   @param {Source} source Source to extend
   @returns {Source} Extended source
   */
  extend(source) {
    if (source._fetchable === undefined) {
      extend(source, this.interface);
    }
    return source;
  },

  interface: {
    _fetchable: true,

    fetch(queryOrExpression) {
      const query = Query.from(queryOrExpression, this.queryBuilder);

      return this._fetch(query)
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
