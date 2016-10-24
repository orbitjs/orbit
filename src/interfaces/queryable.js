import { assert } from '../lib/assert';
import { extend } from '../lib/objects';
import Query from '../query';
import Source from '../source';

export default {
  /**
   Mixes the `Queryable` interface into a source.

   The `Queryable` interface adds a single method to a source: `query`. This
   method accepts a `Query` instance or query expression which it then converts
   to a `Query` instance. The source evaluates the query and returns a promise
   that resolves to a static set of results.

   This interface is part of the "request flow" in Orbit. Requests trigger events
   before and after processing of each request. Observers can delay the
   resolution of a request by returning a promise in an event listener.

   The `Queryable` interface introduces the following events:

   * `beforeQuery` - emitted prior to the processing of `query`, this event
     includes the requested `Query` as an argument.

   * `query` - emitted after a `query` has successfully returned, this
     event's arguments include both the requested `Query` and the results.

   * `queryFail` - emitted when an error has occurred processing a query, this
     event's arguments include both the requested `Query` and the error.

   A `Queryable` source must implement a private method `_query`, which performs
   the processing required for `query` and returns a promise that resolves to a
   set of results.

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

    query(queryOrExpression, options) {
      const query = Query.from(queryOrExpression, options);
      return this._enqueueRequest('query', query);
    },

    __query__(query) {
      return this.fulfillInSeries('beforeQuery', query)
        .then(() => this._query(query))
        .then((result) => {
          return this.settleInSeries('query', query, result)
            .then(() => result);
        })
        .catch((error) => {
          return this.settleInSeries('queryFail', query, error)
            .then(() => { throw error; });
        });
    }
  }
};
