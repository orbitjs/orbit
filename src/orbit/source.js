import Orbit from 'orbit';
import Evented from './evented';
import TransformLog from './transform/log';
import ActionQueue from './action-queue';

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
    this.transformLog = new TransformLog();
    this.requestQueue = new ActionQueue();
    this.syncQueue = new ActionQueue();
  }

  /**
   Truncates the source's logged and tracked transforms to remove everything
   before a particular `transformId`.

   @method truncateHistory
   @param {string} transformId - The ID of the transform to truncate history to.
   @param {number} relativePosition - An integer position relative to the specified transform.
   @returns {undefined}
  */
  truncateHistory(transformId, relativePosition = 0) {
    this.transformLog.truncate(transformId, relativePosition);
  }

  /**
   Clears the source's logged and tracked transforms entirely.

   @method clearHistory
   @returns {undefined}
  */
  clearHistory() {
    this.transformLog.clear();
  }

  /////////////////////////////////////////////////////////////////////////////
  // Private methods
  /////////////////////////////////////////////////////////////////////////////

  /**
   Notifies listeners that this source has been transformed by emitting the
   `transform` event.

   Resolves when any promises returned to event listeners are resolved.

   Also, adds an entry to the Source's `transformLog` for each transform.

   @private
   @method _transformed
   @param {Array} transforms - Transforms that have occurred.
   @returns {Promise} Promise that resolves to transforms.
  */
  _transformed(transforms) {
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

  _enqueueRequest(method, ...args) {
    return enqueueAction(this, this.requestQueue, method, ...args);
  }

  _enqueueSync(method, ...args) {
    return enqueueAction(this, this.syncQueue, method, ...args);
  }
}

function enqueueAction(source, queue, method, ...args) {
  const action = queue.push({
    data: { method, args },
    process: () => {
      return source[`__${method}__`].apply(source, args);
    }
  });

  return action.settle();
}

Evented.extend(Source.prototype);
