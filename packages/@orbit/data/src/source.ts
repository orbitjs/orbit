import Orbit from './main';
import {
  evented, Evented, settleInSeries,
  Bucket,
  TaskQueue,
  Task, Performer,
  Log
} from '@orbit/core';
import KeyMap from './key-map';
import Schema from './schema';
import QueryBuilder from './query-builder';
import Transform from './transform';
import TransformBuilder from './transform-builder';
import { assert } from '@orbit/utils';

export interface SourceSettings {
  name?: string;
  schema?: Schema;
  keyMap?: KeyMap;
  bucket?: Bucket;
  queryBuilder?: QueryBuilder;
  transformBuilder?: TransformBuilder;
}

export type SourceClass = (new () => Source);

/**
 Base class for sources.

 @class Source
 @namespace Orbit
 @param {Object} [settings] - settings for source
 @param {String} [settings.name] - Name for source
 @param {Schema} [settings.schema] - Schema for source
 @constructor
 */
@evented
export abstract class Source implements Evented, Performer {
  protected _name: string;
  protected _bucket: Bucket;
  protected _keyMap: KeyMap;
  protected _schema: Schema;
  protected _transformLog: Log;
  protected _requestQueue: TaskQueue;
  protected _syncQueue: TaskQueue;
  protected _queryBuilder: QueryBuilder;
  protected _transformBuilder: TransformBuilder;

  // Evented interface stubs
  on: (event: string, callback: Function, binding?: object) => void;
  off: (event: string, callback: Function, binding?: object) => void;
  one: (event: string, callback: Function, binding?: object) => void;
  emit: (event: string, ...args) => void;
  listeners: (event: string) => any[];

  constructor(settings: SourceSettings = {}) {
    this._schema = settings.schema;
    this._keyMap = settings.keyMap;
    const name = this._name = settings.name;
    const bucket = this._bucket = settings.bucket;
    this._queryBuilder = settings.queryBuilder;
    this._transformBuilder = settings.transformBuilder;

    if (bucket) {
      assert('TransformLog requires a name if it has a bucket', !!name);
    }

    this._transformLog = new Log({ name: name ? `${name}-log` : undefined, bucket });
    this._requestQueue = new TaskQueue(this, { name: name ? `${name}-requests` : undefined, bucket });
    this._syncQueue = new TaskQueue(this, { name: name ? `${name}-sync` : undefined, bucket });
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

  get transformLog(): Log {
    return this._transformLog;
  }

  get requestQueue(): TaskQueue {
    return this._requestQueue;
  }

  get syncQueue(): TaskQueue {
    return this._syncQueue;
  }

  get queryBuilder(): QueryBuilder {
    let qb = this._queryBuilder;
    if (qb === undefined) {
      qb = this._queryBuilder = new QueryBuilder();
    }
    return qb;
  }

  get transformBuilder(): TransformBuilder {
    let tb = this._transformBuilder;
    if (tb === undefined) {
      tb = this._transformBuilder = new TransformBuilder();
    }
    return tb;
  }

  // Performer interface
  perform(task: Task): Promise<any> {
    let method = `__${task.type}__`;
    return this[method].call(this, task.data);
  };

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

  private _enqueueRequest(type: string, data: any): Promise<void> {
    return this._requestQueue.push({ type, data });
  }

  private _enqueueSync(type: string, data: any): Promise<void> {
    return this._syncQueue.push({ type, data });
  }
}
