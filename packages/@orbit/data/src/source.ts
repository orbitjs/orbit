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

export interface SourceSettings<
  QueryOptions extends RequestOptions = RequestOptions,
  TransformOptions extends RequestOptions = RequestOptions,
  QueryBuilder = unknown,
  TransformBuilder = unknown
> {
  name?: string;
  bucket?: Bucket;
  queryBuilder?: QueryBuilder;
  transformBuilder?: TransformBuilder;
  autoActivate?: boolean;
  requestQueueSettings?: TaskQueueSettings;
  syncQueueSettings?: TaskQueueSettings;
  defaultQueryOptions?: DefaultRequestOptions<QueryOptions>;
  defaultTransformOptions?: DefaultRequestOptions<TransformOptions>;
}

export type SourceClass<
  QueryOptions extends RequestOptions = RequestOptions,
  TransformOptions extends RequestOptions = RequestOptions,
  QueryBuilder = unknown,
  TransformBuilder = unknown
> = new () => Source<
  QueryOptions,
  TransformOptions,
  QueryBuilder,
  TransformBuilder
>;

export interface Source extends Evented, Performer {}

/**
 * Base class for sources.
 */
@evented
export abstract class Source<
  QueryOptions extends RequestOptions = RequestOptions,
  TransformOptions extends RequestOptions = RequestOptions,
  QueryBuilder = unknown,
  TransformBuilder = unknown
> {
  protected _name?: string;
  protected _bucket?: Bucket;
  protected _transformLog: Log;
  protected _requestQueue: TaskQueue;
  protected _syncQueue: TaskQueue;
  protected _queryBuilder?: QueryBuilder;
  protected _transformBuilder?: TransformBuilder;
  protected _defaultQueryOptions?: DefaultRequestOptions<QueryOptions>;
  protected _defaultTransformOptions?: DefaultRequestOptions<TransformOptions>;
  private _activated?: Promise<void>;

  constructor(
    settings: SourceSettings<
      QueryOptions,
      TransformOptions,
      QueryBuilder,
      TransformBuilder
    > = {}
  ) {
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
      bucket: bucket as Bucket<string[]>
    });

    this._syncQueue = new TaskQueue(this, {
      name: name ? `${name}-sync` : undefined,
      bucket: bucket as Bucket<Task[]>,
      autoActivate: false,
      ...syncQueueSettings
    });

    this._requestQueue = new TaskQueue(this, {
      name: name ? `${name}-requests` : undefined,
      bucket: bucket as Bucket<Task[]>,
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

  get defaultQueryOptions(): DefaultRequestOptions<QueryOptions> | undefined {
    return this._defaultQueryOptions;
  }

  set defaultQueryOptions(
    options: DefaultRequestOptions<QueryOptions> | undefined
  ) {
    this._defaultQueryOptions = options;
  }

  get defaultTransformOptions():
    | DefaultRequestOptions<TransformOptions>
    | undefined {
    return this._defaultTransformOptions;
  }

  set defaultTransformOptions(
    options: DefaultRequestOptions<TransformOptions> | undefined
  ) {
    this._defaultTransformOptions = options;
  }

  getQueryOptions(
    query: Query<QueryExpression>,
    expression?: QueryExpression
  ): QueryOptions | undefined {
    return requestOptionsForSource<QueryOptions>(
      [
        this._defaultQueryOptions,
        query.options as QueryOptions | undefined,
        expression?.options as QueryOptions | undefined
      ],
      this._name
    );
  }

  getTransformOptions(
    transform: Transform<Operation>,
    operation?: Operation
  ): TransformOptions | undefined {
    return requestOptionsForSource(
      [
        this._defaultTransformOptions,
        transform.options as TransformOptions | undefined,
        operation?.options as TransformOptions | undefined
      ],
      this._name
    );
  }

  // Performer interface
  perform(task: Task): Promise<unknown> {
    const methodName = `__${task.type}__`;
    const method = (this as any)[methodName] as (data: any) => Promise<unknown>;

    assert(
      `Method '${methodName}' does not exist on Source`,
      method !== undefined
    );

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
}
