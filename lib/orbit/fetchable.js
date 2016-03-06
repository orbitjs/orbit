import Orbit from './main';
import Evented from './evented';
import { extend } from './lib/objects';

export default {
  /**
   Mixes the `Fetchable` interface into an object

   @method extend
   @param {Object} object Object to extend
   @returns {Object} Extended object
   */
  extend: function(object) {
    if (object._fetchable === undefined) {
      Evented.extend(object);
      extend(object, this.interface);
    }
    return object;
  },

  interface: {
    _fetchable: true,

    fetch(query) {
      return this.series('beforeFetch', query)
        .then(() => {
          const result = this._fetch(query);
          return Orbit.Promise.resolve(result);
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
