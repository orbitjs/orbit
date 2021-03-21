import { RecordKeyMap } from './record-key-map';
import { RecordSchema } from './record-schema';
import { RecordQueryBuilder } from './record-query-builder';
import { RecordTransformBuilder } from './record-transform-builder';
import { Orbit } from '@orbit/core';
import {
  RequestOptions,
  Source,
  SourceClass,
  SourceSettings
} from '@orbit/data';

const { assert } = Orbit;

export interface RecordSourceQueryOptions extends RequestOptions {
  raiseNotFoundExceptions?: boolean;
}

export interface RecordSourceSettings<
  QueryOptions extends RequestOptions = RecordSourceQueryOptions,
  TransformOptions extends RequestOptions = RequestOptions
> extends SourceSettings<
    QueryOptions,
    TransformOptions,
    RecordQueryBuilder,
    RecordTransformBuilder
  > {
  schema: RecordSchema;
  keyMap?: RecordKeyMap;
  autoUpgrade?: boolean;
}

export type RecordSourceClass<
  QueryOptions extends RequestOptions = RecordSourceQueryOptions,
  TransformOptions extends RequestOptions = RequestOptions
> = SourceClass<
  QueryOptions,
  TransformOptions,
  RecordQueryBuilder,
  RecordTransformBuilder
>;

/**
 * Abstract base class for record-based sources.
 */
export abstract class RecordSource<
  QueryOptions extends RequestOptions = RecordSourceQueryOptions,
  TransformOptions extends RequestOptions = RequestOptions
> extends Source<
  QueryOptions,
  TransformOptions,
  RecordQueryBuilder,
  RecordTransformBuilder
> {
  protected _keyMap?: RecordKeyMap;
  protected _schema: RecordSchema;

  constructor(settings: RecordSourceSettings<QueryOptions, TransformOptions>) {
    const autoActivate =
      settings.autoActivate === undefined || settings.autoActivate;

    const schema = settings.schema;

    assert(
      "RecordSource's `schema` must be specified in `settings.schema` constructor argument",
      !!schema
    );

    if (settings.queryBuilder === undefined) {
      settings.queryBuilder = new RecordQueryBuilder();
    }

    if (settings.transformBuilder === undefined) {
      settings.transformBuilder = new RecordTransformBuilder({
        recordInitializer: schema
      });
    }

    super({ ...settings, autoActivate: false });

    this._schema = schema;
    this._keyMap = settings.keyMap;

    if (settings.autoUpgrade === undefined || settings.autoUpgrade) {
      this._schema.on('upgrade', () => this.upgrade());
    }

    if (autoActivate) {
      this.activate();
    }
  }

  get schema(): RecordSchema {
    return this._schema;
  }

  get keyMap(): RecordKeyMap | undefined {
    return this._keyMap;
  }

  get queryBuilder(): RecordQueryBuilder {
    return this._queryBuilder as RecordQueryBuilder;
  }

  get transformBuilder(): RecordTransformBuilder {
    return this._transformBuilder as RecordTransformBuilder;
  }

  /**
   * Upgrade source as part of a schema upgrade.
   */
  async upgrade(): Promise<void> {
    return;
  }
}
