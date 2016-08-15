import Orbit from '../main';
import { assert } from '../lib/assert';
import { extend, isArray } from '../lib/objects';
import Source from '../source';

export default {
  /**
   Mixes the `Syncable` interface into a source.

   The `Syncable` interface adds the `sync` method to a source. This method
   accepts a `Transform` or array of `Transform`s as an argument and applies it
   to the source.

   This interface is part of the "sync flow" in Orbit. This flow is used to
   synchronize the contents of sources.

   Other sources can participate in the resolution of a `sync` by observing
   the `transform` event, which is emitted whenever a new `Transform` is
   applied to a source.

   @method extend
   @param {Object} source - Source to extend
   @returns {Object} Extended source
   */
  extend(source) {
    if (source._syncable === undefined) {
      assert('Syncable interface can only be applied to a Source', source instanceof Source);
      extend(source, this.interface);
    }
    return source;
  },

  interface: {
    _syncable: true,

    sync(transformOrTransforms) {
      if (isArray(transformOrTransforms)) {
        const transforms = transformOrTransforms;

        return transforms.reduce((chain, transform) => {
          return chain.then(() => this.sync(transform));
        }, Orbit.Promise.resolve());
      } else {
        const transform = transformOrTransforms;

        if (this.transformLog.contains(transform.id)) {
          return Orbit.Promise.resolve();
        }

        return this._enqueueSync('sync', transform);
      }
    },

    __sync__(transform) {
      if (this.transformLog.contains(transform.id)) {
        return Orbit.Promise.resolve();
      }

      return this._sync(transform)
        .then(() => this._transformed([transform]));
    }
  }
};
