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
import { StandardRecordNormalizer } from './standard-record-normalizer';
import { RecordNormalizer } from './record';

const { assert } = Orbit;

export interface RecordSourceQueryOptions extends RequestOptions {
  raiseNotFoundExceptions?: boolean;
}

export interface RecordSourceSettings<
  QO extends RequestOptions = RecordSourceQueryOptions,
  TO extends RequestOptions = RequestOptions,
  QB = RecordQueryBuilder,
  TB = RecordTransformBuilder
> extends SourceSettings<QO, TO, QB, TB> {
  schema: RecordSchema;
  keyMap?: RecordKeyMap;
  normalizer?: RecordNormalizer;
  autoUpgrade?: boolean;
}

export type RecordSourceClass<
  QO extends RequestOptions = RecordSourceQueryOptions,
  TO extends RequestOptions = RequestOptions,
  QB = RecordQueryBuilder,
  TB = RecordTransformBuilder
> = SourceClass<QO, TO, QB, TB>;

/**
 * Abstract base class for record-based sources.
 */
export abstract class RecordSource<
  QO extends RequestOptions = RecordSourceQueryOptions,
  TO extends RequestOptions = RequestOptions,
  QB = RecordQueryBuilder,
  TB = RecordTransformBuilder
> extends Source<QO, TO, QB, TB> {
  protected _keyMap?: RecordKeyMap;
  protected _schema: RecordSchema;

  constructor(settings: RecordSourceSettings<QO, TO, QB, TB>) {
    const autoActivate =
      settings.autoActivate === undefined || settings.autoActivate;

    const schema = settings.schema;

    assert(
      "RecordSource's `schema` must be specified in `settings.schema` constructor argument",
      !!schema
    );

    if (
      settings.queryBuilder === undefined ||
      settings.transformBuilder === undefined
    ) {
      let normalizer = settings.normalizer;

      if (normalizer === undefined) {
        normalizer = new StandardRecordNormalizer({
          schema,
          keyMap: settings.keyMap
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

  /**
   * Upgrade source as part of a schema upgrade.
   */
  async upgrade(): Promise<void> {
    return;
  }
}
