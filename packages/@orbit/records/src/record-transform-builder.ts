import { Orbit } from '@orbit/core';
import { TransformBuilderFunc } from '@orbit/data';
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
  UpdateRecordTerm,
  RemoveRecordTerm,
  ReplaceKeyTerm,
  ReplaceAttributeTerm,
  AddToRelatedRecordsTerm,
  ReplaceRelatedRecordTerm,
  ReplaceRelatedRecordsTerm,
  RemoveFromRelatedRecordsTerm
} from './record-operation-term';

const { assert, deprecate } = Orbit;

export type RecordTransformBuilderFunc = TransformBuilderFunc<
  RecordOperation,
  RecordTransformBuilder
>;

export interface RecordTransformBuilderSettings<
  RI = RecordIdentity,
  R = UninitializedRecord
> {
  /**
   * @deprecated since v0.17, replaced by `recordNormalizer`
   */
  recordInitializer?: RecordInitializer;

  normalizer?: RecordNormalizer<RI, R>;
}

export class RecordTransformBuilder<
  RI = RecordIdentity,
  R = UninitializedRecord
> {
  protected _normalizer?: RecordNormalizer<RI, R>;

  constructor(settings: RecordTransformBuilderSettings<RI, R> = {}) {
    this._normalizer = settings.normalizer;

    const { recordInitializer } = settings;
    if (recordInitializer) {
      if (this._normalizer !== undefined) {
        deprecate(
          'A `normalizer` and `recordInitializer` have both been assigned to the `TransformBuilder`. Only the `normalizer` will be used.'
        );
      } else {
        deprecate(
          'A `recordInitializer` has been assigned to the `TransformBuilder`. The `recordInitializer` setting has been deprecated in favor of `normalizer`, and will be treated as if it were a `RecordNormalizer`.'
        );
        this._normalizer = {
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

  get normalizer(): RecordNormalizer<RI, R> | undefined {
    return this._normalizer;
  }

  /**
   * Instantiate a new `addRecord` operation.
   */
  addRecord(record: R): AddRecordTerm {
    return new AddRecordTerm(this.normalizeRecord(record));
  }

  /**
   * Instantiate a new `updateRecord` operation.
   */
  updateRecord(record: R): UpdateRecordTerm {
    return new UpdateRecordTerm(this.normalizeRecord(record));
  }

  /**
   * Instantiate a new `removeRecord` operation.
   */
  removeRecord(record: RI): RemoveRecordTerm {
    return new RemoveRecordTerm(this.normalizeRecordIdentity(record));
  }

  /**
   * Instantiate a new `replaceKey` operation.
   */
  replaceKey(record: RI, key: string, value: string): ReplaceKeyTerm {
    return new ReplaceKeyTerm(this.normalizeRecordIdentity(record), key, value);
  }

  /**
   * Instantiate a new `replaceAttribute` operation.
   */
  replaceAttribute(
    record: RI,
    attribute: string,
    value: unknown
  ): ReplaceAttributeTerm {
    return new ReplaceAttributeTerm(
      this.normalizeRecordIdentity(record),
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
  ): AddToRelatedRecordsTerm {
    return new AddToRelatedRecordsTerm(
      this.normalizeRecordIdentity(record),
      relationship,
      this.normalizeRecordIdentity(relatedRecord)
    );
  }

  /**
   * Instantiate a new `removeFromRelatedRecords` operation.
   */
  removeFromRelatedRecords(
    record: RI,
    relationship: string,
    relatedRecord: RI
  ): RemoveFromRelatedRecordsTerm {
    return new RemoveFromRelatedRecordsTerm(
      this.normalizeRecordIdentity(record),
      relationship,
      this.normalizeRecordIdentity(relatedRecord)
    );
  }

  /**
   * Instantiate a new `replaceRelatedRecords` operation.
   */
  replaceRelatedRecords(
    record: RI,
    relationship: string,
    relatedRecords: RI[]
  ): ReplaceRelatedRecordsTerm {
    return new ReplaceRelatedRecordsTerm(
      this.normalizeRecordIdentity(record),
      relationship,
      relatedRecords.map((ri) => this.normalizeRecordIdentity(ri))
    );
  }

  /**
   * Instantiate a new `replaceRelatedRecord` operation.
   */
  replaceRelatedRecord(
    record: RI,
    relationship: string,
    relatedRecord: RI | null
  ): ReplaceRelatedRecordTerm {
    return new ReplaceRelatedRecordTerm(
      this.normalizeRecordIdentity(record),
      relationship,
      relatedRecord ? this.normalizeRecordIdentity(relatedRecord) : null
    );
  }

  protected normalizeRecord(r: R): InitializedRecord {
    let record: InitializedRecord;
    if (this._normalizer) {
      record = this._normalizer.normalizeRecord(r);
    } else {
      record = (r as unknown) as InitializedRecord;
    }

    assert(
      'All records must be assigned an `id` - either directly or via a `RecordNormalizer` assigned to the `RecordTransformBuilder`.',
      record.id !== undefined
    );

    return record;
  }

  protected normalizeRecordIdentity(recordIdentity: RI): RecordIdentity {
    if (this._normalizer !== undefined) {
      return this._normalizer.normalizeRecordIdentity(recordIdentity);
    } else {
      return (recordIdentity as unknown) as RecordIdentity;
    }
  }
}
