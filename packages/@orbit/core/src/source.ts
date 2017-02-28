import Orbit from './main';
import evented, { Evented, settleInSeries } from './evented';
import Bucket from './bucket';
import KeyMap from './key-map';
import Schema from './schema';
import Transform from './transform';
import TransformLog from './transform-log';
import ActionQueue from './action-queue';
import { assert } from '@orbit/utils';

export interface SourceOptions {
  name?: string;
  schema?: Schema;
  keyMap?: KeyMap;
  bucket?: Bucket;
}

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
  protected _name: string;
  protected _bucket: Bucket;
  protected _keyMap: KeyMap;
  protected _schema: Schema;
  protected _transformLog: TransformLog;
  protected _requestQueue: ActionQueue;
  protected _syncQueue: ActionQueue;

  // Evented interface stubs
  on: (event: string, callback: () => void, binding?: any) => void;
  off: (event: string, callback: () => void, binding?: any) => void;
  one: (event: string, callback: () => void, binding?: any) => void;
  emit: (event: string, ...args) => void;
  listeners: (event: string) => any[];

  constructor(options: SourceOptions = {}) {
    this._schema = options.schema;
    this._keyMap = options.keyMap;
    const name = this._name = options.name;
    const bucket = this._bucket = options.bucket;

    if (bucket) {
      assert('TransformLog requires a name if it has a bucket', !!name);
    }

    this._transformLog = new TransformLog({ name: name ? `${name}-log` : undefined, bucket });
    this._requestQueue = new ActionQueue(this, { name: name ? `${name}-requests` : undefined, bucket });
    this._syncQueue = new ActionQueue(this, { name: name ? `${name}-sync` : undefined, bucket });
  }

  get name(): string {
    return this._name;
  }

  get schema(): Schema {
    return this._schema;
  }

  get keyMap(): KeyMap {
    return this._keyMap;
  }

  get bucket(): Bucket {
    return this._bucket;
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

function enqueueAction(source: Source, queue: ActionQueue, method: string, data: any): Promise<any> {
  return queue.push(`__${method}__`, {
    data,
    meta: {
      method
    }
  })
    .then(action => action.settle());
}
