import Orbit from './main';
import Evented from './evented';
import TransformLog from './transform/log';
import ActionQueue from './action-queue';

/**
 Base class for sources.

 @class Source
 @namespace Orbit
 @param {Object} [options] - Options for source
 @param {String} [options.name] - Name for source
 @param {Schema} [options.schema] - Schema for source
 @constructor
 */
export default class Source {
  constructor(options = {}) {
    const name = this.name = options.name;
    this.schema = options.schema;

    this.transformLog = new TransformLog(null, { name: `${name}-log` });
    this.requestQueue = new ActionQueue(this, { name: `${name}-requests` });
    this.syncQueue = new ActionQueue(this, { name: `${name}-sync` });
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
          return this.settleInSeries('transform', transform);
        });
      }, Orbit.Promise.resolve())
      .then(() => transforms);
  }

  _enqueueRequest(method, data) {
    return enqueueAction(this, this.requestQueue, method, data);
  }

  _enqueueSync(method, data) {
    return enqueueAction(this, this.syncQueue, method, data);
  }
}

function enqueueAction(source, queue, method, data) {
  const action = queue.push(`__${method}__`, {
    data,
    meta: {
      method
    }
  });

  return action.settle();
}

Evented.extend(Source.prototype);
