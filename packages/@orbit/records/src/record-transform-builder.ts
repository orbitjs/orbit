import { Orbit } from '@orbit/core';
import { TransformBuilderFunc } from '@orbit/data';
import { StandardValidator, ValidatorForFn } from '@orbit/validators';
import {
  InitializedRecord,
  RecordIdentity,
  RecordInitializer,
  UninitializedRecord
} from './record';
import { RecordNormalizer } from './record-normalizer';
import { RecordOperation } from './record-operation';
import {
  AddRecordTerm,
  AddToRelatedRecordsTerm,
  RemoveFromRelatedRecordsTerm,
  RemoveRecordTerm,
  ReplaceAttributeTerm,
  ReplaceKeyTerm,
  ReplaceRelatedRecordsTerm,
  ReplaceRelatedRecordTerm,
  UpdateRecordTerm
} from './record-operation-term';
import { RecordSchema } from './record-schema';
import { StandardRecordValidator } from './record-validators/standard-record-validators';

const { assert, deprecate } = Orbit;

export type RecordTransformBuilderFunc = TransformBuilderFunc<
  RecordOperation,
  RecordTransformBuilder
>;

export interface RecordTransformBuilderSettings<
  RT = string,
  RI = RecordIdentity,
  R = UninitializedRecord
> {
  /**
   * @deprecated since v0.17, replaced by `recordNormalizer`
   */
  recordInitializer?: RecordInitializer;

  schema?: RecordSchema;
  normalizer?: RecordNormalizer<RT, RI, R>;
  validatorFor?: ValidatorForFn<StandardValidator | StandardRecordValidator>;
}

export class RecordTransformBuilder<
  RT = string,
  RI = RecordIdentity,
  R = UninitializedRecord
> {
  $schema?: RecordSchema;
  $normalizer?: RecordNormalizer<RT, RI, R>;
  $validatorFor?: ValidatorForFn<StandardValidator | StandardRecordValidator>;

  constructor(settings: RecordTransformBuilderSettings<RT, RI, R> = {}) {
    const { schema, normalizer, validatorFor, recordInitializer } = settings;

    if (validatorFor) {
      assert(
        'A RecordTransformBuilder that has been assigned a `validatorFor` requires a `schema`',
        schema !== undefined
      );
    }

    this.$schema = schema;
    this.$normalizer = normalizer;
    this.$validatorFor = validatorFor;

    if (recordInitializer) {
      if (this.$normalizer !== undefined) {
        deprecate(
          'A `normalizer` and `recordInitializer` have both been assigned to the `TransformBuilder`. Only the `normalizer` will be used.'
        );
      } else {
        deprecate(
          'A `recordInitializer` has been assigned to the `TransformBuilder`. The `recordInitializer` setting has been deprecated in favor of `normalizer`, and will be treated as if it were a `RecordNormalizer`.'
        );
        this.$normalizer = {
          normalizeRecordType(type: RT): string {
            return (type as unknown) as string;
          },
          normalizeRecord(record: R) {
            return recordInitializer.initializeRecord(
              (record as unknown) as UninitializedRecord
            );
          },
          normalizeRecordIdentity(recordIdentity: RI) {
            return (recordIdentity as unknown) as RecordIdentity;
          }
        };
      }
    }
  }

  /**
   * Instantiate a new `addRecord` operation.
   */
  addRecord(record: R): AddRecordTerm<RT, RI, R> {
    return new AddRecordTerm(this, this.$normalizeRecord(record));
  }

  /**
   * Instantiate a new `updateRecord` operation.
   */
  updateRecord(record: R): UpdateRecordTerm<RT, RI, R> {
    return new UpdateRecordTerm(this, this.$normalizeRecord(record));
  }

  /**
   * Instantiate a new `removeRecord` operation.
   */
  removeRecord(record: RI): RemoveRecordTerm<RT, RI, R> {
    return new RemoveRecordTerm(this, this.$normalizeRecordIdentity(record));
  }

  /**
   * Instantiate a new `replaceKey` operation.
   */
  replaceKey(
    record: RI,
    key: string,
    value: string
  ): ReplaceKeyTerm<RT, RI, R> {
    return new ReplaceKeyTerm(
      this,
      this.$normalizeRecordIdentity(record),
      key,
      value
    );
  }

  /**
   * Instantiate a new `replaceAttribute` operation.
   */
  replaceAttribute(
    record: RI,
    attribute: string,
    value: unknown
  ): ReplaceAttributeTerm<RT, RI, R> {
    return new ReplaceAttributeTerm(
      this,
      this.$normalizeRecordIdentity(record),
      attribute,
      value
    );
  }

  /**
   * Instantiate a new `addToRelatedRecords` operation.
   */
  addToRelatedRecords(
    record: RI,
    relationship: string,
    relatedRecord: RI
  ): AddToRelatedRecordsTerm<RT, RI, R> {
    return new AddToRelatedRecordsTerm(
      this,
      this.$normalizeRecordIdentity(record),
      relationship,
      this.$normalizeRecordIdentity(relatedRecord)
    );
  }

  /**
   * Instantiate a new `removeFromRelatedRecords` operation.
   */
  removeFromRelatedRecords(
    record: RI,
    relationship: string,
    relatedRecord: RI
  ): RemoveFromRelatedRecordsTerm<RT, RI, R> {
    return new RemoveFromRelatedRecordsTerm(
      this,
      this.$normalizeRecordIdentity(record),
      relationship,
      this.$normalizeRecordIdentity(relatedRecord)
    );
  }

  /**
   * Instantiate a new `replaceRelatedRecords` operation.
   */
  replaceRelatedRecords(
    record: RI,
    relationship: string,
    relatedRecords: RI[]
  ): ReplaceRelatedRecordsTerm<RT, RI, R> {
    return new ReplaceRelatedRecordsTerm(
      this,
      this.$normalizeRecordIdentity(record),
      relationship,
      relatedRecords.map((ri) => this.$normalizeRecordIdentity(ri))
    );
  }

  /**
   * Instantiate a new `replaceRelatedRecord` operation.
   */
  replaceRelatedRecord(
    record: RI,
    relationship: string,
    relatedRecord: RI | null
  ): ReplaceRelatedRecordTerm<RT, RI, R> {
    return new ReplaceRelatedRecordTerm(
      this,
      this.$normalizeRecordIdentity(record),
      relationship,
      relatedRecord ? this.$normalizeRecordIdentity(relatedRecord) : null
    );
  }

  $normalizeRecord(r: R): InitializedRecord {
    if (this.$normalizer) {
      return this.$normalizer.normalizeRecord(r);
    } else {
      return (r as unknown) as InitializedRecord;
    }
  }

  $normalizeRecordIdentity(ri: RI): RecordIdentity {
    if (this.$normalizer !== undefined) {
      return this.$normalizer.normalizeRecordIdentity(ri);
    } else {
      return (ri as unknown) as RecordIdentity;
    }
  }
}
