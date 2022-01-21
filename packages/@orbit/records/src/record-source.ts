import { Orbit } from '@orbit/core';
import {
  RequestOptions,
  Source,
  SourceClass,
  SourceSettings
} from '@orbit/data';
import { Dict } from '@orbit/utils';
import { StandardValidator, ValidatorForFn } from '@orbit/validators';
import { RecordKeyMap } from './record-key-map';
import { RecordNormalizer } from './record-normalizer';
import { RecordQueryBuilder } from './record-query-builder';
import { RecordSchema } from './record-schema';
import { RecordTransformBuilder } from './record-transform-builder';
import { buildRecordValidatorFor } from './record-validators/record-validator-builder';
import { StandardRecordValidator } from './record-validators/standard-record-validators';
import { StandardRecordNormalizer } from './standard-record-normalizer';

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

  /**
   * A completely custom set of validators.
   */
  validatorFor?: ValidatorForFn<StandardValidator | StandardRecordValidator>;

  /**
   * Custom validators to override, and be merged with, the standard ones which
   * will be built as long as `autoValidate !== false`.
   */
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

  /**
   * Automatically upgrade this source whenever its schema is upgraded.
   *
   * Override the `upgrade` method to provide an upgrade implementation.
   *
   * @default true
   */
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
  protected _validatorFor?: ValidatorForFn<
    StandardValidator | StandardRecordValidator
  >;

  // Unlike in `Source`, builders will always be set
  protected _queryBuilder!: QB;
  protected _transformBuilder!: TB;

  constructor(settings: RecordSourceSettings<QO, TO, QB, TB>) {
    const autoActivate =
      settings.autoActivate === undefined || settings.autoActivate;

    const { schema } = settings;
    let { validatorFor, validators } = settings;

    const autoValidate = settings.autoValidate !== false;

    if (!autoValidate) {
      assert(
        'RecordSource should not be constructed with a `validatorFor` or `validators` if `autoValidate === false`',
        validators === undefined && validatorFor === undefined
      );
    } else if (validatorFor !== undefined) {
      assert(
        'RecordSource can be constructed with either a `validatorFor` or `validators`, but not both',
        validators === undefined
      );
    } else {
      validatorFor = buildRecordValidatorFor({ validators });
    }

    assert(
      "RecordSource's `schema` must be specified in `settings.schema` constructor argument",
      !!schema
    );

    if (
      settings.queryBuilder === undefined ||
      settings.transformBuilder === undefined
    ) {
      let { normalizer } = settings;

      if (normalizer === undefined) {
        normalizer = new StandardRecordNormalizer({
          schema,
          keyMap: settings.keyMap,
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

    super({ ...settings, autoActivate: false });

    this._schema = schema;
    this._keyMap = settings.keyMap;
    this._validatorFor = validatorFor;

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

  get validatorFor():
    | ValidatorForFn<StandardValidator | StandardRecordValidator>
    | undefined {
    return this._validatorFor;
  }

  get queryBuilder(): QB {
    return this._queryBuilder;
  }

  get transformBuilder(): TB {
    return this._transformBuilder;
  }

  /**
   * Upgrade source as part of a schema upgrade.
   */
  async upgrade(): Promise<void> {
    return;
  }
}
