import Orbit from './main';
import Evented from './evented';
import TransformLog from './transform/log';
import ActionQueue from './action-queue';
import { assert } from './lib/assert';

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
    assert('Source requires a name', options.name);

    const name = this.name = options.name;
    const bucket = this.bucket = options.bucket;
    this.schema = options.schema;

    this.transformLog = new TransformLog(null, { name: `${name}-log`, bucket });
    this.requestQueue = new ActionQueue(this, { name: `${name}-requests`, bucket });
    this.syncQueue = new ActionQueue(this, { name: `${name}-sync`, bucket });
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

          return this.transformLog.append(transform.id)
            .then(() => this.settleInSeries('transform', transform));
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
  return queue.push(`__${method}__`, {
    data,
    meta: {
      method
    }
  })
    .then(action => action.settle());
}

Evented.extend(Source.prototype);
