import Orbit from './main';
import evented, { Evented, settleInSeries } from './evented';
import Bucket from './bucket';
import Schema from './schema';
import Transform from './transform';
import TransformLog from './transform-log';
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
@evented
export default class Source implements Evented {
  private _name: string;
  private _bucket: Bucket;
  private _schema: Schema;
  private _transformLog: TransformLog;
  private _requestQueue: ActionQueue;
  private _syncQueue: ActionQueue;
  
  // Evented interface stubs
  on: (event: string, callback: () => void, binding?: any) => void;
  off: (event: string, callback: () => void, binding?: any) => void;
  one: (event: string, callback: () => void, binding?: any) => void;
  emit: (event: string, ...args) => void;
  listeners: (event: string) => any[];

  constructor(name: string, schema: Schema, bucket?: Bucket) {
    this._name = name;
    this._schema = schema;
    this._bucket = bucket;

    this._transformLog = new TransformLog(null, { name: `${name}-log`, bucket });
    this._requestQueue = new ActionQueue(this, { name: `${name}-requests`, bucket });
    this._syncQueue = new ActionQueue(this, { name: `${name}-sync`, bucket });
  }

  get name(): string {
    return this._name;
  }

  get bucket(): Bucket {
    return this._bucket;
  }

  get schema(): Schema {
    return this._schema;
  }

  get transformLog(): TransformLog {
    return this._transformLog;
  }

  get requestQueue(): ActionQueue {
    return this._requestQueue;
  }

  get syncQueue(): ActionQueue {
    return this._syncQueue; 
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
  private _transformed(transforms: Transform[]): Promise<Transform[]> {
    return transforms
      .reduce((chain, transform) => {
        return chain.then(() => {
          if (this._transformLog.contains(transform.id)) {
            return Orbit.Promise.resolve();
          }

          return this._transformLog.append(transform.id)
            .then(() => settleInSeries(this, 'transform', transform));
        });
      }, Orbit.Promise.resolve())
      .then(() => transforms);
  }

  private _enqueueRequest(method: string, data: any): Promise<void> {
    return enqueueAction(this, this._requestQueue, method, data);
  }

  private _enqueueSync(method: string, data: any): Promise<void> {
    return enqueueAction(this, this._syncQueue, method, data);
  }
}

function enqueueAction(source: Source, queue: ActionQueue, method: string, data: any): Promise<void> {
  return queue.push(`__${method}__`, {
    data,
    meta: {
      method
    }
  })
    .then(action => action.settle());
}
