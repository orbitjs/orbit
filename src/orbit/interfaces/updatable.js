import Orbit from '../main';
import { assert } from '../lib/assert';
import { extend } from '../lib/objects';
import Transform from '../transform';
import Source from '../source';

export default {
  /**
   Mixes the `Updatable` interface into a source.

   The `Updatable` interface adds a single method to a source: `update`. This
   method accepts a `Transform` instance or an array of operations which it then
   converts to a `Transform` instance. The source applies the update and returns
   a promise that resolves when complete.

   This interface is part of the "request flow" in Orbit. Requests trigger
   events before and after processing of each request. Observers can delay the
   resolution of a request by returning a promise in an event listener.

   The `Updatable` interface introduces the following events:

   * `beforeUpdate` - emitted prior to the processing of `update`, this event
     includes the requested `Transform` as an argument.

   * `update` - emitted after an `update` has successfully been applied, this
     event includes the requested `Transform` as an argument.

   * `updateFail` - emitted when an error has occurred applying an update, this
     event's arguments include both the requested `Transform` and the error.

   An `Updatable` source must implement a private method `_update`, which
   performs the processing required for `update` and returns a promise that
   resolves when complete.

   @method extend
   @param {Object} source - Source to extend
   @returns {Object} Extended source
   */
  extend(source) {
    if (source._updatable === undefined) {
      assert('Updatable interface can only be applied to a Source', source instanceof Source);
      extend(source, this.interface);
    }
    return source;
  },

  interface: {
    _updatable: true,

    update(transformOrOperations) {
      const transform = Transform.from(transformOrOperations);

      if (this.transformLog.contains(transform.id)) {
        return Orbit.Promise.resolve([]);
      }

      return this._enqueueRequest('update', transform);
    },

    __update__(transform) {
      if (this.transformLog.contains(transform.id)) {
        return Orbit.Promise.resolve([]);
      }

      return this.fulfillInSeries('beforeUpdate', transform)
        .then(() => this._update(transform))
        .then(() => this._transformed([transform]))
        .then(() => this.settleInSeries('update', transform))
        .catch(error => {
          return this.settleInSeries('updateFail', transform, error)
            .then(() => { throw error; });
        });
    }
  }
};
