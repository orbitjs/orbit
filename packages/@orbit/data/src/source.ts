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
import { Operation } from './operation';
import { Query } from './query';
import { QueryExpression } from './query-expression';
import {
  DefaultRequestOptions,
  RequestOptions,
  requestOptionsForSource
} from './request';
import { Transform } from './transform';

const { assert } = Orbit;

export interface SourceSettings<QueryBuilder, TransformBuilder> {
  name?: string;
  bucket?: Bucket;
  queryBuilder?: QueryBuilder;
  transformBuilder?: TransformBuilder;
  autoActivate?: boolean;
  requestQueueSettings?: TaskQueueSettings;
  syncQueueSettings?: TaskQueueSettings;
  defaultQueryOptions?: DefaultRequestOptions;
  defaultTransformOptions?: DefaultRequestOptions;
}

export type SourceClass<
  QueryBuilder = unknown,
  TransformBuilder = unknown
> = new () => Source<QueryBuilder, TransformBuilder>;

/**
 * Base class for sources.
 */
@evented
export abstract class Source<QueryBuilder = unknown, TransformBuilder = unknown>
  implements Evented, Performer {
  protected _name?: string;
  protected _bucket?: Bucket;
  protected _transformLog: Log;
  protected _requestQueue: TaskQueue;
  protected _syncQueue: TaskQueue;
  protected _queryBuilder?: QueryBuilder;
  protected _transformBuilder?: TransformBuilder;
  protected _defaultQueryOptions?: DefaultRequestOptions;
  protected _defaultTransformOptions?: DefaultRequestOptions;
  private _activated?: Promise<void>;

  // Evented interface stubs
  on!: (event: string, listener: Listener) => () => void;
  off!: (event: string, listener?: Listener) => void;
  one!: (event: string, listener: Listener) => () => void;
  emit!: (event: string, ...args: any[]) => void;
  listeners!: (event: string) => Listener[];

  constructor(settings: SourceSettings<QueryBuilder, TransformBuilder> = {}) {
    const name = (this._name = settings.name);
    const bucket = (this._bucket = settings.bucket);
    const requestQueueSettings = settings.requestQueueSettings || {};
    const syncQueueSettings = settings.syncQueueSettings || {};
    const autoActivate =
      settings.autoActivate === undefined || settings.autoActivate;

    this._queryBuilder = settings.queryBuilder;
    this._transformBuilder = settings.transformBuilder;

    this._defaultQueryOptions = settings.defaultQueryOptions;
    this._defaultTransformOptions = settings.defaultTransformOptions;

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

    if (autoActivate) {
      this.activate();
    }
  }

  get name(): string | undefined {
    return this._name;
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

  get queryBuilder(): QueryBuilder | undefined {
    return this._queryBuilder;
  }

  get transformBuilder(): TransformBuilder | undefined {
    return this._transformBuilder;
  }

  get defaultQueryOptions(): DefaultRequestOptions | undefined {
    return this._defaultQueryOptions;
  }

  get defaultTransformOptions(): DefaultRequestOptions | undefined {
    return this._defaultTransformOptions;
  }

  getQueryOptions(
    query: Query<QueryExpression>,
    expression?: QueryExpression
  ): RequestOptions | undefined {
    return requestOptionsForSource(
      [this._defaultQueryOptions, query.options, expression?.options],
      this._name
    );
  }

  getTransformOptions(
    transform: Transform<Operation>,
    operation?: Operation
  ): RequestOptions | undefined {
    return requestOptionsForSource(
      [this._defaultTransformOptions, transform.options, operation?.options],
      this._name
    );
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
  async transformed(transforms: Transform<Operation>[]): Promise<void> {
    await this.activated;

    for (let transform of transforms) {
      if (!this._transformLog.contains(transform.id)) {
        await this._transformLog.append(transform.id);
        await settleInSeries(this, 'transform', transform);
      }
    }
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
