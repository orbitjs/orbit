import {
  Record,
  RecordIdentity,
  RecordInitializer
} from './record';
import {
  AddRecordOperation,
  ReplaceRecordOperation,
  RemoveRecordOperation,
  ReplaceKeyOperation,
  ReplaceAttributeOperation,
  AddToRelatedRecordsOperation,
  RemoveFromRelatedRecordsOperation,
  ReplaceRelatedRecordsOperation,
  ReplaceRelatedRecordOperation
} from './operation';
import { eq } from '@orbit/utils';

export interface TransformBuilderSettings {
  recordInitializer?: RecordInitializer;
}

export default class TransformBuilder {
  private _recordInitializer: RecordInitializer;

  constructor(settings: TransformBuilderSettings = {}) {
    this._recordInitializer = settings.recordInitializer;
  }

  /**
   * Instantiate a new `addRecord` operation.
   *
   * @param {Record} record
   * @returns {AddRecordOperation}
   */
  addRecord(record: Record): AddRecordOperation {
    if (this._recordInitializer) {
      this._recordInitializer.initializeRecord(record);
    }
    return { op: 'addRecord', record};
  }

  /**
   * Instantiate a new `replaceRecord` operation.
   *
   * @param {Record} record
   * @returns {ReplaceRecordOperation}
   */
  replaceRecord(record: Record): ReplaceRecordOperation {
    return { op: 'replaceRecord', record};
  }

  /**
   * Instantiate a new `removeRecord` operation.
   *
   * @param {RecordIdentity} record
   * @returns {RemoveRecordOperation}
   */
  removeRecord(record: RecordIdentity): RemoveRecordOperation {
    return { op: 'removeRecord', record};
  }

  /**
   * Instantiate a new `replaceKey` operation.
   *
   * @param {RecordIdentity} record
   * @param {string} key
   * @param {string} value
   * @returns {ReplaceKeyOperation}
   */
  replaceKey(record: RecordIdentity, key: string, value: string): ReplaceKeyOperation {
    return { op: 'replaceKey', record, key, value };
  }

  /**
   * Instantiate a new `replaceAttribute` operation.
   *
   * @param {RecordIdentity} record
   * @param {string} attribute
   * @param {*} value
   * @returns {ReplaceAttributeOperation}
   */
  replaceAttribute(record: RecordIdentity, attribute: string, value: any): ReplaceAttributeOperation {
    return { op: 'replaceAttribute', record, attribute, value };
  }

  /**
   * Instantiate a new `addToRelatedRecords` operation.
   *
   * @param {RecordIdentity} record
   * @param {string} relationship
   * @param {RecordIdentity} relatedRecord
   * @returns {AddToRelatedRecordsOperation}
   */
  addToRelatedRecords(record: RecordIdentity, relationship: string, relatedRecord: RecordIdentity): AddToRelatedRecordsOperation {
    return { op: 'addToRelatedRecords', record, relationship, relatedRecord };
  }

  /**
   * Instantiate a new `removeFromRelatedRecords` operation.
   *
   * @param {RecordIdentity} record
   * @param {string} relationship
   * @param {RecordIdentity} relatedRecord
   * @returns {RemoveFromRelatedRecordsOperation}
   */
  removeFromRelatedRecords(record: RecordIdentity, relationship: string, relatedRecord: RecordIdentity): RemoveFromRelatedRecordsOperation {
    return { op: 'removeFromRelatedRecords', record, relationship, relatedRecord };
  }

  /**
   * Instantiate a new `replaceRelatedRecords` operation.
   *
   * @param {RecordIdentity} record
   * @param {string} relationship
   * @param {RecordIdentity[]} relatedRecords
   * @returns {ReplaceRelatedRecordsOperation}
   */
  replaceRelatedRecords(record: RecordIdentity, relationship: string, relatedRecords: RecordIdentity[]): ReplaceRelatedRecordsOperation {
    return { op: 'replaceRelatedRecords', record, relationship, relatedRecords };
  }

  /**
   * Instantiate a new `replaceRelatedRecord` operation.
   *
   * @param {RecordIdentity} record
   * @param {string} relationship
   * @param {RecordIdentity} relatedRecord
   * @returns {ReplaceRelatedRecordOperation}
   */
  replaceRelatedRecord(record: RecordIdentity, relationship: string, relatedRecord: RecordIdentity): ReplaceRelatedRecordOperation {
    return { op: 'replaceRelatedRecord', record, relationship, relatedRecord };
  }
}