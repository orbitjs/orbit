import Orbit from '@orbit/core';
import { Record, RecordIdentity, RecordInitializer } from './record';
import {
  AddRecordOperation,
  UpdateRecordOperation,
  RemoveRecordOperation,
  ReplaceKeyOperation,
  ReplaceAttributeOperation,
  AddToRelatedRecordsOperation,
  RemoveFromRelatedRecordsOperation,
  ReplaceRelatedRecordsOperation,
  ReplaceRelatedRecordOperation
} from './operation';

export interface TransformBuilderSettings {
  recordInitializer?: RecordInitializer;
}

export default class TransformBuilder {
  private _recordInitializer: RecordInitializer;

  constructor(settings: TransformBuilderSettings = {}) {
    this._recordInitializer = settings.recordInitializer;
  }

  get recordInitializer(): RecordInitializer {
    return this._recordInitializer;
  }

  /**
   * Instantiate a new `addRecord` operation.
   */
  addRecord(record: Record): AddRecordOperation {
    if (this._recordInitializer) {
      this._recordInitializer.initializeRecord(record);
    }
    return { op: 'addRecord', record };
  }

  /**
   * Instantiate a new `updateRecord` operation.
   *
   * @deprecated
   */
  replaceRecord(record: Record): UpdateRecordOperation {
    Orbit.deprecate(
      'The `replaceRecord` operation is deprecated in favor of `updateRecord`'
    );
    return { op: 'updateRecord', record };
  }

  /**
   * Instantiate a new `updateRecord` operation.
   */
  updateRecord(record: Record): UpdateRecordOperation {
    return { op: 'updateRecord', record };
  }

  /**
   * Instantiate a new `removeRecord` operation.
   */
  removeRecord(record: RecordIdentity): RemoveRecordOperation {
    return { op: 'removeRecord', record };
  }

  /**
   * Instantiate a new `replaceKey` operation.
   */
  replaceKey(
    record: RecordIdentity,
    key: string,
    value: string
  ): ReplaceKeyOperation {
    return { op: 'replaceKey', record, key, value };
  }

  /**
   * Instantiate a new `replaceAttribute` operation.
   */
  replaceAttribute(
    record: RecordIdentity,
    attribute: string,
    value: any
  ): ReplaceAttributeOperation {
    return { op: 'replaceAttribute', record, attribute, value };
  }

  /**
   * Instantiate a new `addToRelatedRecords` operation.
   */
  addToRelatedRecords(
    record: RecordIdentity,
    relationship: string,
    relatedRecord: RecordIdentity
  ): AddToRelatedRecordsOperation {
    return { op: 'addToRelatedRecords', record, relationship, relatedRecord };
  }

  /**
   * Instantiate a new `removeFromRelatedRecords` operation.
   */
  removeFromRelatedRecords(
    record: RecordIdentity,
    relationship: string,
    relatedRecord: RecordIdentity
  ): RemoveFromRelatedRecordsOperation {
    return {
      op: 'removeFromRelatedRecords',
      record,
      relationship,
      relatedRecord
    };
  }

  /**
   * Instantiate a new `replaceRelatedRecords` operation.
   */
  replaceRelatedRecords(
    record: RecordIdentity,
    relationship: string,
    relatedRecords: RecordIdentity[]
  ): ReplaceRelatedRecordsOperation {
    return {
      op: 'replaceRelatedRecords',
      record,
      relationship,
      relatedRecords
    };
  }

  /**
   * Instantiate a new `replaceRelatedRecord` operation.
   */
  replaceRelatedRecord(
    record: RecordIdentity,
    relationship: string,
    relatedRecord: RecordIdentity | null
  ): ReplaceRelatedRecordOperation {
    return { op: 'replaceRelatedRecord', record, relationship, relatedRecord };
  }
}
