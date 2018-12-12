import {
  Record,
  RecordIdentity,
  RecordOperation,
} from '@orbit/data';
import { SyncOperationProcessor } from '../sync-operation-processor';

/**
 * An operation processor that ensures that an operation is compatible with
 * its associated schema.
 */
export default class SyncSchemaValidationProcessor extends SyncOperationProcessor {
  validate(operation: RecordOperation) {
    switch (operation.op) {
      case 'addRecord':
        return this._recordAdded(operation.record);

      case 'replaceRecord':
        return this._recordReplaced(operation.record);

      case 'removeRecord':
        return this._recordRemoved(operation.record);

      case 'replaceKey':
        return this._keyReplaced(operation.record);

      case 'replaceAttribute':
        return this._attributeReplaced(operation.record);

      case 'addToRelatedRecords':
        return this._relatedRecordAdded(operation.record, operation.relationship, operation.relatedRecord);

      case 'removeFromRelatedRecords':
        return this._relatedRecordRemoved(operation.record, operation.relationship, operation.relatedRecord);

      case 'replaceRelatedRecords':
        return this._relatedRecordsReplaced(operation.record, operation.relationship, operation.relatedRecords);

      case 'replaceRelatedRecord':
        return this._relatedRecordReplaced(operation.record, operation.relationship, operation.relatedRecord);

      default:
        return;
    }
  }

  protected _recordAdded(record: Record) {
    this._validateRecord(record);
  }

  protected _recordReplaced(record: Record) {
    this._validateRecord(record);
  }

  protected _recordRemoved(record: RecordIdentity) {
    this._validateRecordIdentity(record);
  }

  protected _keyReplaced(record: RecordIdentity) {
    this._validateRecordIdentity(record);
  }

  protected _attributeReplaced(record: RecordIdentity) {
    this._validateRecordIdentity(record);
  }

  protected _relatedRecordAdded(record: RecordIdentity, relationship: string, relatedRecord: RecordIdentity) {
    this._validateRecordIdentity(record);
    this._validateRecordIdentity(relatedRecord);
  }

  protected _relatedRecordRemoved(record: RecordIdentity, relationship: string, relatedRecord: RecordIdentity) {
    this._validateRecordIdentity(record);
    this._validateRecordIdentity(relatedRecord);
  }

  protected _relatedRecordsReplaced(record: RecordIdentity, relationship: string, relatedRecords: RecordIdentity[]) {
    this._validateRecordIdentity(record);

    relatedRecords.forEach(record => {
      this._validateRecordIdentity(record);
    });
  }

  protected _relatedRecordReplaced(record: RecordIdentity, relationship: string, relatedRecord: RecordIdentity | null) {
    this._validateRecordIdentity(record);

    if (relatedRecord) {
      this._validateRecordIdentity(relatedRecord);
    }
  }

  protected _validateRecord(record: Record) {
    this._validateRecordIdentity(record);
  }

  protected _validateRecordIdentity(record: RecordIdentity) {
    this.accessor.schema.getModel(record.type);
  }
}
