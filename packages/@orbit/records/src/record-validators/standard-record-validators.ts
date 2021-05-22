import { RecordAttributeValidator } from './record-attribute-validator';
import { RecordFieldDefinitionValidator } from './record-field-definition-validator';
import { RecordIdentityValidator } from './record-identity-validator';
import { RecordKeyValidator } from './record-key-validator';
import { RecordOperationValidator } from './record-operation-validator';
import { RecordQueryExpressionValidator } from './record-query-expression-validator';
import { RecordRelationshipValidator } from './record-relationship-validator';
import { RecordTypeValidator } from './record-type-validator';
import { RecordValidator } from './record-validator';
import { RelatedRecordValidator } from './related-record-validator';

export enum StandardRecordValidators {
  Record = 'record',
  RecordAttribute = 'recordAttribute',
  RecordIdentity = 'recordIdentity',
  RecordKey = 'recordKey',
  RecordOperation = 'recordOperation',
  RecordQueryExpression = 'recordQueryExpression',
  RecordRelationship = 'recordRelationship',
  RecordType = 'recordType',
  RelatedRecord = 'relatedRecord',
  RecordFieldDefinition = 'recordFieldDefinition'
}

export type StandardRecordValidator =
  | RecordValidator
  | RecordAttributeValidator
  | RecordIdentityValidator
  | RecordKeyValidator
  | RecordOperationValidator
  | RecordQueryExpressionValidator
  | RecordRelationshipValidator
  | RecordTypeValidator
  | RelatedRecordValidator
  | RecordFieldDefinitionValidator;
