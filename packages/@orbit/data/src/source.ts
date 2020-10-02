import {
  Orbit,
  evented,
  Evented,
  settleInSeries,
  Bucket,
  TaskQueue,
  TaskQueueSettings,
  Task,
  Performer,
  Listener,
  Log
} from '@orbit/core';
import { KeyMap } from './key-map';
import { Schema } from './schema';
import { QueryBuilder } from './query-builder';
import { Transform } from './transform';
import { TransformBuilder } from './transform-builder';

const { assert } = Orbit;

export interface SourceSettings {
  name?: string;
  schema?: Schema;
  keyMap?: KeyMap;
  bucket?: Bucket;
  queryBuilder?: QueryBuilder;
  transformBuilder?: TransformBuilder;
  autoUpgrade?: boolean;
  autoActivate?: boolean;
  requestQueueSettings?: TaskQueueSettings;
  syncQueueSettings?: TaskQueueSettings;
}

export type SourceClass = new () => Source;

/**
 * Base class for sources.
 */
@evented
export abstract class Source implements Evented, Performer {
  protected _name?: string;
  protected _bucket?: Bucket;
  protected _keyMap?: KeyMap;
  protected _schema?: Schema;
  protected _transformLog: Log;
  protected _requestQueue: TaskQueue;
  protected _syncQueue: TaskQueue;
  protected _queryBuilder?: QueryBuilder;
  protected _transformBuilder?: TransformBuilder;
  private _activated?: Promise<void>;

  // Evented interface stubs
  on!: (event: string, listener: Listener) => () => void;
  off!: (event: string, listener?: Listener) => void;
  one!: (event: string, listener: Listener) => () => void;
  emit!: (event: string, ...args: any[]) => void;
  listeners!: (event: string) => Listener[];

  constructor(settings: SourceSettings = {}) {
    this._schema = settings.schema;
    this._keyMap = settings.keyMap;
    const name = (this._name = settings.name);
    const bucket = (this._bucket = settings.bucket);
    this._queryBuilder = settings.queryBuilder;
    this._transformBuilder = settings.transformBuilder;
    const requestQueueSettings = settings.requestQueueSettings || {};
    const syncQueueSettings = settings.syncQueueSettings || {};
    const autoActivate =
      settings.autoActivate === undefined || settings.autoActivate;

    if (bucket) {
      assert('TransformLog requires a name if it has a bucket', !!name);
    }

    this._transformLog = new Log({
      name: name ? `${name}-log` : undefined,
      bucket
    });

    this._syncQueue = new TaskQueue(this, {
      name: name ? `${name}-sync` : undefined,
      bucket,
      autoActivate: false,
      ...syncQueueSettings
    });

    this._requestQueue = new TaskQueue(this, {
      name: name ? `${name}-requests` : undefined,
      bucket,
      autoActivate: false,
      ...requestQueueSettings
    });

    if (
      this._schema &&
      (settings.autoUpgrade === undefined || settings.autoUpgrade)
    ) {
      this._schema.on('upgrade', () => this.upgrade());
    }

    if (autoActivate) {
      this.activate();
    }
  }

  get name(): string | undefined {
    return this._name;
  }

  get schema(): Schema | undefined {
    return this._schema;
  }

  get keyMap(): KeyMap | undefined {
    return this._keyMap;
  }

  get bucket(): Bucket | undefined {
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
      tb = this._transformBuilder = new TransformBuilder({
        recordInitializer: this._schema
      });
    }
    return tb;
  }

  // Performer interface
  perform(task: Task): Promise<unknown> {
    let method = (this as any)[`__${task.type}__`] as (
      data: any
    ) => Promise<unknown>;
    return method.call(this, task.data);
  }

  /**
   * Upgrade source as part of a schema upgrade.
   */
  upgrade(): Promise<void> {
    return Promise.resolve();
  }

  get activated(): Promise<void> {
    if (!this._activated) {
      throw new Error(`"${this.name}" source is not activated`);
    }
    return this._activated;
  }

  async activate(): Promise<void> {
    if (!this._activated) {
      this._activated = this._activate();
    }
    await this._activated;
  }

  async deactivate(): Promise<void> {
    if (this._activated) {
      await this._activated;
    }

    this._activated = undefined;
  }

  /**
   * Notifies listeners that this source has been transformed by emitting the
   * `transform` event.
   *
   * Resolves when any promises returned to event listeners are resolved.
   *
   * Also, adds an entry to the Source's `transformLog` for each transform.
   */
  async transformed(transforms: Transform[]): Promise<Transform[]> {
    await this.activated;

    for (let transform of transforms) {
      if (!this._transformLog.contains(transform.id)) {
        await this._transformLog.append(transform.id);
        await settleInSeries(this, 'transform', transform);
      }
    }

    return transforms;
  }

  /////////////////////////////////////////////////////////////////////////////
  // Protected methods
  /////////////////////////////////////////////////////////////////////////////

  protected async _activate(): Promise<void> {
    await this._transformLog.reified;
    await this._syncQueue.activate();
    await this._requestQueue.activate();
  }

  protected _enqueueRequest(type: string, data: unknown): Promise<unknown> {
    return this._requestQueue.push({ type, data });
  }

  protected _enqueueSync(type: string, data: unknown): Promise<unknown> {
    return this._syncQueue.push({ type, data });
  }
}
