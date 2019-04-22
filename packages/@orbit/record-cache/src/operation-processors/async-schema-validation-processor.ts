import {
  Record,
  RecordIdentity,
  RecordOperation,
  RelationshipNotFound,
  IncorrectRelatedRecordType
} from '@orbit/data';
import { AsyncOperationProcessor } from '../async-operation-processor';

/**
 * An operation processor that ensures that an operation is compatible with
 * its associated schema.
 */
export default class AsyncSchemaValidationProcessor extends AsyncOperationProcessor {
  async validate(operation: RecordOperation): Promise<void> {
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
    this._validateRelationship(record, relationship, relatedRecord);
  }

  protected _relatedRecordRemoved(record: RecordIdentity, relationship: string, relatedRecord: RecordIdentity) {
    this._validateRecordIdentity(record);
    this._validateRecordIdentity(relatedRecord);
  }

  protected _relatedRecordsReplaced(record: RecordIdentity, relationship: string, relatedRecords: RecordIdentity[]) {
    this._validateRecordIdentity(record);

    relatedRecords.forEach(relatedRecord => {
      this._validateRecordIdentity(relatedRecord);
      this._validateRelationship(record, relationship, relatedRecord);
    });
  }

  protected _relatedRecordReplaced(record: RecordIdentity, relationship: string, relatedRecord: RecordIdentity | null) {
    this._validateRecordIdentity(record);

    if (relatedRecord) {
      this._validateRecordIdentity(relatedRecord);
      this._validateRelationship(record, relationship, relatedRecord);
    }
  }


  protected _validateRecord(record: Record) {
    this._validateRecordIdentity(record);
  }

  protected _validateRecordIdentity(record: RecordIdentity) {
    this._getModelSchema(record.type);
  }

  protected _validateRelationship(record: Record, relationship: string, relatedRecord: RecordIdentity) {
    const modelSchema = this._getModelSchema(record.type);
    const relationshipDef = modelSchema.relationships && modelSchema.relationships[relationship];
    if (relationshipDef === undefined) {
      throw new RelationshipNotFound(relationship, record.type);
    }
    if (Array.isArray(relationshipDef.model)) {
      if (!relationshipDef.model.includes(relatedRecord.type)) {
        throw new IncorrectRelatedRecordType(relatedRecord.type, relationship, record.type);
      }
    } else if (typeof relationshipDef.model === 'string') {
      if (relationshipDef.model !== relatedRecord.type) {
        throw new IncorrectRelatedRecordType(relatedRecord.type, relationship, record.type);
      }
    }
  } 

  private _getModelSchema(type: string) {
    return this.accessor.schema.getModel(type);
  }
}
