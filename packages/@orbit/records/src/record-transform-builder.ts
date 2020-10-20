import { Orbit } from '@orbit/core';
import {
  Record,
  RecordIdentity,
  RecordInitializer,
  UninitializedRecord
} from './record';
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

export interface RecordTransformBuilderSettings {
  recordInitializer?: RecordInitializer;
}

export class RecordTransformBuilder {
  private _recordInitializer?: RecordInitializer;

  constructor(settings: RecordTransformBuilderSettings = {}) {
    this._recordInitializer = settings.recordInitializer;
  }

  get recordInitializer(): RecordInitializer | undefined {
    return this._recordInitializer;
  }

  /**
   * Instantiate a new `addRecord` operation.
   */
  addRecord(newRecord: Record | UninitializedRecord): AddRecordTerm {
    let record: Record;

    if (this._recordInitializer) {
      record = this._recordInitializer.initializeRecord(newRecord);

      if (!record) {
        deprecate(
          'The `RecordInitializer` assigned to the `TransformBuilder` exhibits deprecated behavior. `initializeRecord` should return a record.'
        );
        // Assume that `initializeRecord` is following its old signature and initializing the passed `record`.
        record = newRecord as Record;
      }
    } else {
      record = newRecord as Record;
    }

    assert(
      'New records must be assigned an `id` - either directly or via a `RecordInitializer` assigned to the `RecordTransformBuilder`.',
      record.id !== undefined
    );

    return new AddRecordTerm(record);
  }

  /**
   * Instantiate a new `updateRecord` operation.
   */
  updateRecord(record: Record): UpdateRecordTerm {
    return new UpdateRecordTerm(record);
  }

  /**
   * Instantiate a new `removeRecord` operation.
   */
  removeRecord(record: RecordIdentity): RemoveRecordTerm {
    return new RemoveRecordTerm(record);
  }

  /**
   * Instantiate a new `replaceKey` operation.
   */
  replaceKey(
    record: RecordIdentity,
    key: string,
    value: string
  ): ReplaceKeyTerm {
    return new ReplaceKeyTerm(record, key, value);
  }

  /**
   * Instantiate a new `replaceAttribute` operation.
   */
  replaceAttribute(
    record: RecordIdentity,
    attribute: string,
    value: unknown
  ): ReplaceAttributeTerm {
    return new ReplaceAttributeTerm(record, attribute, value);
  }

  /**
   * Instantiate a new `addToRelatedRecords` operation.
   */
  addToRelatedRecords(
    record: RecordIdentity,
    relationship: string,
    relatedRecord: RecordIdentity
  ): AddToRelatedRecordsTerm {
    return new AddToRelatedRecordsTerm(record, relationship, relatedRecord);
  }

  /**
   * Instantiate a new `removeFromRelatedRecords` operation.
   */
  removeFromRelatedRecords(
    record: RecordIdentity,
    relationship: string,
    relatedRecord: RecordIdentity
  ): RemoveFromRelatedRecordsTerm {
    return new RemoveFromRelatedRecordsTerm(
      record,
      relationship,
      relatedRecord
    );
  }

  /**
   * Instantiate a new `replaceRelatedRecords` operation.
   */
  replaceRelatedRecords(
    record: RecordIdentity,
    relationship: string,
    relatedRecords: RecordIdentity[]
  ): ReplaceRelatedRecordsTerm {
    return new ReplaceRelatedRecordsTerm(record, relationship, relatedRecords);
  }

  /**
   * Instantiate a new `replaceRelatedRecord` operation.
   */
  replaceRelatedRecord(
    record: RecordIdentity,
    relationship: string,
    relatedRecord: RecordIdentity | null
  ): ReplaceRelatedRecordTerm {
    return new ReplaceRelatedRecordTerm(record, relationship, relatedRecord);
  }
}
