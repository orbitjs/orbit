import Orbit from './main';
import Evented from './evented';
import TransformLog from './transform/log';

/**
 Base class for sources.

 @class Source
 @namespace Orbit
 @param {Object} [options] - Options for source
 @param {String} [options.name] - Name for source
 @constructor
 */
export default class Source {
  constructor(options = {}) {
    this.name = options.name;
    Evented.extend(this);
    this.transformLog = new TransformLog();
  }

  /**
   Notifies listeners that this source has been transformed by emitting the
   `transform` event.

   Resolves when any promises returned to event listeners are resolved.

   Also, adds an entry to the Source's `transformLog` for each transform.

   @method transformed
   @param {Array} transforms - Transforms that have occurred.
   @returns {Promise} Promise that resolves to transforms.
  */
  transformed(transforms) {
    return transforms
      .reduce((chain, transform) => {
        return chain.then(() => {
          if (this.transformLog.contains(transform.id)) {
            return Orbit.Promise.resolve();
          }

          this.transformLog.append(transform.id);
          return this.settle('transform', transform);
        });
      }, Orbit.Promise.resolve())
      .then(() => transforms);
  }

  /**
   Truncates the source's logged and tracked transforms to remove everything
   before a particular `transformId`.

   @method truncateHistory
   @param {string} transformId - The ID of the transform to truncate history to.
   @returns {undefined}
  */
  truncateHistory(transformId) {
    this.transformLog.truncate(transformId);
  }

  /**
   Clears the source's logged and tracked transforms entirely.

   @method clearHistory
   @returns {undefined}
  */
  clearHistory() {
    this.transformLog.clear();
  }
}
