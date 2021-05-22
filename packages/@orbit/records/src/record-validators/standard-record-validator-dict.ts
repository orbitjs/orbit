import { Dict } from '@orbit/utils';
import { validateRecordAttribute } from './record-attribute-validator';
import { validateRecordFieldDefinition } from './record-field-definition-validator';
import { validateRecordIdentity } from './record-identity-validator';
import { validateRecordKey } from './record-key-validator';
import { validateRecordOperation } from './record-operation-validator';
import { validateRecordQueryExpression } from './record-query-expression-validator';
import { validateRecordRelationship } from './record-relationship-validator';
import { validateRecordType } from './record-type-validator';
import { validateRecord } from './record-validator';
import { validateRelatedRecord } from './related-record-validator';
import { StandardRecordValidator } from './standard-record-validators';

export const standardRecordValidators: Dict<StandardRecordValidator> = {
  record: validateRecord,
  recordAttribute: validateRecordAttribute,
  recordIdentity: validateRecordIdentity,
  recordKey: validateRecordKey,
  recordOperation: validateRecordOperation,
  recordQueryExpression: validateRecordQueryExpression,
  recordRelationship: validateRecordRelationship,
  recordType: validateRecordType,
  relatedRecord: validateRelatedRecord,
  recordFieldDefinition: validateRecordFieldDefinition
};
