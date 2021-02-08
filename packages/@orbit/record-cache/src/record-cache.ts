import Orbit, { evented, Evented } from '@orbit/core';
import {
  DefaultRequestOptions,
  RequestOptions,
  requestOptionsForSource
} from '@orbit/data';
import {
  RecordKeyMap,
  RecordOperation,
  RecordSchema,
  RecordQueryBuilder,
  RecordTransformBuilder,
  RecordQueryExpression,
  RecordQuery,
  RecordTransform
} from '@orbit/records';
const { assert } = Orbit;

export interface RecordCacheQueryOptions extends RequestOptions {
  raiseNotFoundExceptions?: boolean;
}

export interface RecordCacheSettings<
  QueryOptions extends RequestOptions = RecordCacheQueryOptions,
  TransformOptions extends RequestOptions = RequestOptions
> {
  name?: string;
  schema: RecordSchema;
  keyMap?: RecordKeyMap;
  transformBuilder?: RecordTransformBuilder;
  queryBuilder?: RecordQueryBuilder;
  defaultQueryOptions?: DefaultRequestOptions<QueryOptions>;
  defaultTransformOptions?: DefaultRequestOptions<TransformOptions>;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface RecordCache<
  QueryOptions extends RequestOptions = RecordCacheQueryOptions,
  TransformOptions extends RequestOptions = RequestOptions
> extends Evented {}

@evented
export abstract class RecordCache<
  QueryOptions extends RequestOptions = RecordCacheQueryOptions,
  TransformOptions extends RequestOptions = RequestOptions
> {
  protected _name?: string;
  protected _keyMap?: RecordKeyMap;
  protected _schema: RecordSchema;
  protected _transformBuilder: RecordTransformBuilder;
  protected _queryBuilder: RecordQueryBuilder;
  protected _defaultQueryOptions?: DefaultRequestOptions<QueryOptions>;
  protected _defaultTransformOptions?: DefaultRequestOptions<TransformOptions>;

  constructor(settings: RecordCacheSettings<QueryOptions, TransformOptions>) {
    assert(
      "SyncRecordCache's `schema` must be specified in `settings.schema` constructor argument",
      !!settings.schema
    );

    this._name = settings.name;
    this._schema = settings.schema;
    this._keyMap = settings.keyMap;

    this._queryBuilder = settings.queryBuilder || new RecordQueryBuilder();
    this._transformBuilder =
      settings.transformBuilder ||
      new RecordTransformBuilder({
        recordInitializer: this._schema
      });

    this._defaultQueryOptions = settings.defaultQueryOptions;
    this._defaultTransformOptions = settings.defaultTransformOptions;
  }

  get name(): string | undefined {
    return this._name;
  }

  get schema(): RecordSchema {
    return this._schema;
  }

  get keyMap(): RecordKeyMap | undefined {
    return this._keyMap;
  }

  get queryBuilder(): RecordQueryBuilder {
    return this._queryBuilder;
  }

  get transformBuilder(): RecordTransformBuilder {
    return this._transformBuilder;
  }

  get defaultQueryOptions(): DefaultRequestOptions<QueryOptions> | undefined {
    return this._defaultQueryOptions;
  }

  get defaultTransformOptions():
    | DefaultRequestOptions<TransformOptions>
    | undefined {
    return this._defaultTransformOptions;
  }

  getQueryOptions(
    query: RecordQuery,
    expression?: RecordQueryExpression
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
    transform: RecordTransform,
    operation?: RecordOperation
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
}
