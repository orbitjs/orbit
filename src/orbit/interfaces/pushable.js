import Orbit from '../main';
import Source from '../source';
import { assert } from '../lib/assert';
import { extend } from '../lib/objects';

export default {
  /**
   Mixes the `Pushable` interface into a source.

   The `Pushable` interface adds a single method to a Source: `push`. This
   method accepts a `Transform` instance as an argument and returns a promise
   that resolves to an array of `Transform` instances that are applied as a
   result. In other words, `push` captures the direct and side effects of
   applying a `Transform` to a source.

   This interface is part of the "request flow" in Orbit. Requests trigger
   events before and after processing of each request. Observers can delay the
   resolution of a request by returning a promise in an event listener.

   The `Pushable` interface introduces the following events:

   * `beforePush` - emitted prior to the processing of `push`, this event
     includes the requested `Transform` as an argument.

   * `push` - emitted after a `push` has successfully been applied, this
     event's arguments include both the requested `Transform` and an array of
     the actual applied `Transform` instances.

   * `pushFail` - emitted when an error has occurred pushing a transform, this
     event's arguments include both the requested `Transform` and the error.

   A `Pushable` source must implement a private method `_push`, which performs
   the processing required for `push` and returns a promise that resolves to an
   array of `Transform` instances.

   @method extend
   @param {Object} source - Source to extend
   @returns {Object} Extended source
   */
  extend(source) {
    if (source._pushable === undefined) {
      assert('Pushable interface can only be applied to a Source', source instanceof Source);
      extend(source, this.interface);
    }
    return source;
  },

  interface: {
    _pushable: true,

    push(transform) {
      if (this.transformLog.contains(transform.id)) {
        return Orbit.Promise.resolve([]);
      }

      return this.series('beforePush', transform)
        .then(() => this._push(transform))
        .then(result => this._transformed(result))
        .then(result => {
          return this.settle('push', transform, result)
            .then(() => result);
        })
        .catch(error => {
          return this.settle('pushFail', transform, error)
            .then(() => { throw error; });
        });
    }
  }
};
