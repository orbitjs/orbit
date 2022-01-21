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
  StandardRecordNormalizer,
  StandardRecordValidator,
  buildRecordValidatorFor
} from '@orbit/records';
import { Dict } from '@orbit/utils';
import { StandardValidator, ValidatorForFn } from '@orbit/validators';
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
  validatorFor?: ValidatorForFn<StandardValidator | StandardRecordValidator>;
  validators?: Dict<StandardValidator | StandardRecordValidator>;

  /**
   * Automatically validate the contents of all requests.
   *
   * If true, builds a `validatorFor` function if one has not been provided.
   * This will include standard validators as well as any custom `validators`
   * that may be provided.
   *
   * @default true
   */
  autoValidate?: boolean;

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
  protected _validatorFor?: ValidatorForFn<
    StandardValidator | StandardRecordValidator
  >;
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
      'RecordCache requires a `schema` setting to be constructed',
      !!settings.schema
    );

    const { name, schema, keyMap } = settings;

    this._name = name;
    this._schema = schema;
    this._keyMap = keyMap;

    let { validatorFor, validators } = settings;
    const autoValidate = settings.autoValidate !== false;

    if (!autoValidate) {
      assert(
        'RecordCache should not be constructed with a `validatorFor` or `validators` if `autoValidate === false`',
        validators === undefined && validatorFor === undefined
      );
    } else if (validatorFor !== undefined) {
      assert(
        'RecordCache can be constructed with either a `validatorFor` or `validators`, but not both',
        validators === undefined
      );
    } else {
      validatorFor = buildRecordValidatorFor({ validators });
    }

    this._validatorFor = validatorFor;

    if (
      settings.queryBuilder === undefined ||
      settings.transformBuilder === undefined
    ) {
      let normalizer = settings.normalizer;

      if (normalizer === undefined) {
        normalizer = new StandardRecordNormalizer({
          schema,
          keyMap,
          validateInputs: autoValidate
        });
      }

      if (settings.queryBuilder === undefined) {
        (settings as any).queryBuilder = new RecordQueryBuilder({
          schema,
          normalizer,
          validatorFor
        });
      }

      if (settings.transformBuilder === undefined) {
        (settings as any).transformBuilder = new RecordTransformBuilder({
          schema,
          normalizer,
          validatorFor
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

  get validatorFor():
    | ValidatorForFn<StandardValidator | StandardRecordValidator>
    | undefined {
    return this._validatorFor;
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
