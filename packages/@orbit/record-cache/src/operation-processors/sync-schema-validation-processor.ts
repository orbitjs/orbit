import {
  InitializedRecord,
  RecordIdentity,
  RecordOperation,
  IncorrectRelatedRecordType
} from '@orbit/records';
import { SyncOperationProcessor } from '../sync-operation-processor';
import { getModelDef, getRelationshipDef } from './utils/schema-utils';

/**
 * An operation processor that ensures that an operation is compatible with
 * its associated schema.
 */
export class SyncSchemaValidationProcessor extends SyncOperationProcessor {
  validate(operation: RecordOperation): void {
    switch (operation.op) {
      case 'addRecord':
        return this._recordAdded(operation.record);

      case 'updateRecord':
        return this._recordReplaced(operation.record);

      case 'removeRecord':
        return this._recordRemoved(operation.record);

      case 'replaceKey':
        return this._keyReplaced(operation.record);

      case 'replaceAttribute':
        return this._attributeReplaced(operation.record);

      case 'addToRelatedRecords':
        return this._relatedRecordAdded(
          operation.record,
          operation.relationship,
          operation.relatedRecord
        );

      case 'removeFromRelatedRecords':
        return this._relatedRecordRemoved(
          operation.record,
          operation.relationship,
          operation.relatedRecord
        );

      case 'replaceRelatedRecords':
        return this._relatedRecordsReplaced(
          operation.record,
          operation.relationship,
          operation.relatedRecords
        );

      case 'replaceRelatedRecord':
        return this._relatedRecordReplaced(
          operation.record,
          operation.relationship,
          operation.relatedRecord
        );

      default:
        return;
    }
  }

  protected _recordAdded(record: InitializedRecord): void {
    this._validateRecord(record);
  }

  protected _recordReplaced(record: InitializedRecord): void {
    this._validateRecord(record);
  }

  protected _recordRemoved(record: RecordIdentity): void {
    this._validateRecordIdentity(record);
  }

  protected _keyReplaced(record: RecordIdentity): void {
    this._validateRecordIdentity(record);
  }

  protected _attributeReplaced(record: RecordIdentity): void {
    this._validateRecordIdentity(record);
  }

  protected _relatedRecordAdded(
    record: RecordIdentity,
    relationship: string,
    relatedRecord: RecordIdentity
  ): void {
    this._validateRecordIdentity(record);
    this._validateRecordIdentity(relatedRecord);
    this._validateRelationship(record, relationship, relatedRecord);
  }

  protected _relatedRecordRemoved(
    record: RecordIdentity,
    relationship: string,
    relatedRecord: RecordIdentity
  ): void {
    this._validateRecordIdentity(record);
    this._validateRecordIdentity(relatedRecord);
  }

  protected _relatedRecordsReplaced(
    record: RecordIdentity,
    relationship: string,
    relatedRecords: RecordIdentity[]
  ): void {
    this._validateRecordIdentity(record);

    relatedRecords.forEach((relatedRecord) => {
      this._validateRecordIdentity(relatedRecord);
      this._validateRelationship(record, relationship, relatedRecord);
    });
  }

  protected _relatedRecordReplaced(
    record: RecordIdentity,
    relationship: string,
    relatedRecord: RecordIdentity | null
  ): void {
    this._validateRecordIdentity(record);

    if (relatedRecord) {
      this._validateRecordIdentity(relatedRecord);
      this._validateRelationship(record, relationship, relatedRecord);
    }
  }

  protected _validateRecord(record: InitializedRecord): void {
    this._validateRecordIdentity(record);
  }

  protected _validateRecordIdentity(record: RecordIdentity): void {
    getModelDef(this.accessor.schema, record.type);
  }

  protected _validateRelationship(
    record: InitializedRecord,
    relationship: string,
    relatedRecord: RecordIdentity
  ): void {
    const relationshipDef = getRelationshipDef(
      this.accessor.schema,
      record.type,
      relationship
    );
    const type = relationshipDef.kind
      ? relationshipDef.type
      : relationshipDef.model;
    if (Array.isArray(type)) {
      if (!type.includes(relatedRecord.type)) {
        throw new IncorrectRelatedRecordType(
          relatedRecord.type,
          relationship,
          record.type
        );
      }
    } else if (typeof type === 'string') {
      if (type !== relatedRecord.type) {
        throw new IncorrectRelatedRecordType(
          relatedRecord.type,
          relationship,
          record.type
        );
      }
    }
  }
}
