import { Orbit, evented, Evented } from '@orbit/core';
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
  RecordTransform,
  RecordNormalizer,
  StandardRecordNormalizer
} from '@orbit/records';
const { assert } = Orbit;

export interface RecordCacheQueryOptions extends RequestOptions {
  raiseNotFoundExceptions?: boolean;
}

export interface RecordCacheTransformOptions extends RequestOptions {
  raiseNotFoundExceptions?: boolean;
  useBuffer?: boolean;
}

export interface RecordCacheSettings<
  QueryOptions extends RequestOptions = RecordCacheQueryOptions,
  TransformOptions extends RequestOptions = RecordCacheTransformOptions,
  QueryBuilder = RecordQueryBuilder,
  TransformBuilder = RecordTransformBuilder
> {
  name?: string;
  schema: RecordSchema;
  keyMap?: RecordKeyMap;
  normalizer?: RecordNormalizer;
  queryBuilder?: QueryBuilder;
  transformBuilder?: TransformBuilder;
  defaultQueryOptions?: DefaultRequestOptions<QueryOptions>;
  defaultTransformOptions?: DefaultRequestOptions<TransformOptions>;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface RecordCache extends Evented {}

@evented
export abstract class RecordCache<
  QueryOptions extends RequestOptions = RecordCacheQueryOptions,
  TransformOptions extends RequestOptions = RecordCacheTransformOptions,
  QueryBuilder = RecordQueryBuilder,
  TransformBuilder = RecordTransformBuilder
> {
  protected _name?: string;
  protected _keyMap?: RecordKeyMap;
  protected _schema: RecordSchema;
  protected _queryBuilder: QueryBuilder;
  protected _transformBuilder: TransformBuilder;
  protected _defaultQueryOptions?: DefaultRequestOptions<QueryOptions>;
  protected _defaultTransformOptions?: DefaultRequestOptions<TransformOptions>;

  constructor(
    settings: RecordCacheSettings<
      QueryOptions,
      TransformOptions,
      QueryBuilder,
      TransformBuilder
    >
  ) {
    assert(
      "SyncRecordCache's `schema` must be specified in `settings.schema` constructor argument",
      !!settings.schema
    );

    const { name, schema, keyMap } = settings;

    this._name = name;
    this._schema = schema;
    this._keyMap = keyMap;

    if (
      settings.queryBuilder === undefined ||
      settings.transformBuilder === undefined
    ) {
      let normalizer = settings.normalizer;

      if (normalizer === undefined) {
        normalizer = new StandardRecordNormalizer({
          schema,
          keyMap
        });
      }

      if (settings.queryBuilder === undefined) {
        (settings as any).queryBuilder = new RecordQueryBuilder({
          normalizer
        });
      }

      if (settings.transformBuilder === undefined) {
        (settings as any).transformBuilder = new RecordTransformBuilder({
          normalizer
        });
      }
    }

    this._queryBuilder = settings.queryBuilder as QueryBuilder;
    this._transformBuilder = settings.transformBuilder as TransformBuilder;

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

  get queryBuilder(): QueryBuilder {
    return this._queryBuilder;
  }

  get transformBuilder(): TransformBuilder {
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
