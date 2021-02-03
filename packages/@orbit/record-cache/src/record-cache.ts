import Orbit, { evented, Evented, Listener } from '@orbit/core';
import { DefaultRequestOptions, requestOptionsForSource } from '@orbit/data';
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

export interface RecordCacheSettings {
  name?: string;
  schema: RecordSchema;
  keyMap?: RecordKeyMap;
  transformBuilder?: RecordTransformBuilder;
  queryBuilder?: RecordQueryBuilder;
  defaultQueryOptions?: DefaultRequestOptions;
  defaultTransformOptions?: DefaultRequestOptions;
}

@evented
export abstract class RecordCache implements Evented {
  protected _name?: string;
  protected _keyMap?: RecordKeyMap;
  protected _schema: RecordSchema;
  protected _transformBuilder: RecordTransformBuilder;
  protected _queryBuilder: RecordQueryBuilder;
  protected _defaultQueryOptions?: DefaultRequestOptions;
  protected _defaultTransformOptions?: DefaultRequestOptions;

  // Evented interface stubs
  on!: (event: string, listener: Listener) => () => void;
  off!: (event: string, listener?: Listener) => void;
  one!: (event: string, listener: Listener) => () => void;
  emit!: (event: string, ...args: any[]) => void;
  listeners!: (event: string) => Listener[];

  constructor(settings: RecordCacheSettings) {
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

  get defaultQueryOptions(): DefaultRequestOptions | undefined {
    return this._defaultQueryOptions;
  }

  get defaultTransformOptions(): DefaultRequestOptions | undefined {
    return this._defaultTransformOptions;
  }

  getQueryOptions(
    query: RecordQuery,
    expression?: RecordQueryExpression
  ): DefaultRequestOptions | undefined {
    return requestOptionsForSource(
      [this._defaultQueryOptions, query.options, expression?.options],
      this._name
    );
  }

  getTransformOptions(
    transform: RecordTransform,
    operation?: RecordOperation
  ): DefaultRequestOptions | undefined {
    return requestOptionsForSource(
      [this._defaultTransformOptions, transform.options, operation?.options],
      this._name
    );
  }
}
