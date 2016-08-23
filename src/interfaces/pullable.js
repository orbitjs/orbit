import { assert } from '../lib/assert';
import { extend } from '../lib/objects';
import Source from '../source';

export default {
  /**
   Mixes the `Pullable` interface into a source.

   The `Pullable` interface adds a single method to a Source: `pull`. This
   method accepts a `Query` instance as an argument and returns a promise
   that resolves to an array of `Transform` instances that represent the
   changeset that resulted from applying the query. In other words, a `pull`
   request retrieves the results of a query in `Transform` form.

   This interface is part of the "request flow" in Orbit. Requests trigger
   events before and after processing of each request. Observers can delay the
   resolution of a request by returning a promise in an event listener.

   The `Pullable` interface introduces the following events:

   * `beforePull` - emitted prior to the processing of `pull`, this event
     includes the requested `Query` as an argument.

   * `pull` - emitted after a `pull` has successfully been requested, this
     event's arguments include both the requested `Query` and an array of
     the resulting `Transform` instances.

   * `pullFail` - emitted when an error has occurred processing a `pull`, this
     event's arguments include both the requested `Query` and the error.

   A `Pullable` source must implement a private method `_pull`, which performs
   the processing required for `pull` and returns a promise that resolves to an
   array of `Transform` instances.

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
      return this._enqueueRequest('pull', query);
    },

    __pull__(query) {
      return this.fulfillInSeries('beforePull', query)
        .then(() => this._pull(query))
        .then(result => this._transformed(result))
        .then(result => {
          return this.settleInSeries('pull', query, result)
            .then(() => result);
        })
        .catch(error => {
          return this.settleInSeries('pullFail', query, error)
            .then(() => { throw error; });
        });
    }
  }
};
