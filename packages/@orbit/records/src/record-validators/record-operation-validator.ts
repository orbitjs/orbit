import { Assertion } from '@orbit/core';
import {
  formatValidationDescription,
  StandardValidator,
  ValidationIssue,
  Validator,
  ValidatorForFn
} from '@orbit/validators';
import { RecordOperation } from '../record-operation';
import { RecordSchema } from '../record-schema';
import { RecordAttributeValidator } from './record-attribute-validator';
import { RecordIdentityValidator } from './record-identity-validator';
import { RecordKeyValidator } from './record-key-validator';
import { RecordRelationshipValidator } from './record-relationship-validator';
import { RecordValidationIssue, RecordValidator } from './record-validator';
import {
  RelatedRecordValidationIssue,
  RelatedRecordValidator
} from './related-record-validator';
import {
  StandardRecordValidator,
  StandardRecordValidators
} from './standard-record-validators';

export interface RecordOperationValidationOptions {
  validatorFor: ValidatorForFn<StandardValidator | StandardRecordValidator>;
  schema: RecordSchema;
}

interface BaseIssue extends ValidationIssue {
  validator: StandardRecordValidators.RecordOperation;
  ref: RecordOperation;
}

interface OperationAllowedIssue extends BaseIssue {
  validation: 'operationAllowed';
}

interface OperationValidIssue extends BaseIssue {
  validation: 'operationValid';
  details: (RecordValidationIssue | RelatedRecordValidationIssue)[];
}

export type RecordOperationValidationIssue =
  | OperationAllowedIssue
  | OperationValidIssue;

export type RecordOperationValidator = Validator<
  RecordOperation,
  RecordOperationValidationOptions,
  RecordOperationValidationIssue
>;

export const validateRecordOperation: RecordOperationValidator = (
  operation: RecordOperation,
  options?: {
    schema: RecordSchema;
    validatorFor: ValidatorForFn<StandardValidator | StandardRecordValidator>;
  }
): undefined | RecordOperationValidationIssue[] => {
  if (options?.validatorFor === undefined || options?.schema === undefined) {
    throw new Assertion(
      'validateRecordOperation requires both a `validationFor` and a `schema`.'
    );
  }

  const { schema, validatorFor } = options;
  let issues;

  switch (operation.op) {
    case 'addRecord':
      issues = (validatorFor(
        StandardRecordValidators.Record
      ) as RecordValidator)(operation.record, { schema, validatorFor });
      break;

    case 'updateRecord':
      issues = (validatorFor(
        StandardRecordValidators.Record
      ) as RecordValidator)(operation.record, {
        schema,
        validatorFor,
        partialRecord: true
      });
      break;

    case 'removeRecord':
      issues = (validatorFor(
        StandardRecordValidators.RecordIdentity
      ) as RecordIdentityValidator)(operation.record, { schema, validatorFor });
      break;

    case 'replaceKey':
      issues = (validatorFor(
        StandardRecordValidators.RecordKey
      ) as RecordKeyValidator)(operation, { schema, validatorFor });
      break;

    case 'replaceAttribute':
      issues = (validatorFor(
        StandardRecordValidators.RecordAttribute
      ) as RecordAttributeValidator)(operation, { schema, validatorFor });
      break;

    case 'addToRelatedRecords':
      issues = (validatorFor(
        StandardRecordValidators.RelatedRecord
      ) as RelatedRecordValidator)(operation, { schema, validatorFor });
      break;

    case 'removeFromRelatedRecords':
      issues = (validatorFor(
        StandardRecordValidators.RelatedRecord
      ) as RelatedRecordValidator)(operation, { schema, validatorFor });
      break;

    case 'replaceRelatedRecords':
      issues = (validatorFor(
        StandardRecordValidators.RecordRelationship
      ) as RecordRelationshipValidator)(
        {
          record: operation.record,
          relationship: operation.relationship,
          data: operation.relatedRecords
        },
        { schema, validatorFor }
      );
      break;

    case 'replaceRelatedRecord':
      issues = (validatorFor(
        StandardRecordValidators.RecordRelationship
      ) as RecordRelationshipValidator)(
        {
          record: operation.record,
          relationship: operation.relationship,
          data: operation.relatedRecord
        },
        { schema, validatorFor }
      );
      break;

    default:
      return [
        {
          validator: StandardRecordValidators.RecordOperation,
          validation: 'operationAllowed',
          ref: operation,
          description: `record operation '${
            (operation as any).op
          }' is not recognized`
        }
      ];
  }

  if (issues !== undefined) {
    return [
      {
        validator: StandardRecordValidators.RecordOperation,
        validation: 'operationValid',
        ref: operation,
        details: issues,
        description: formatValidationDescription(
          'record operation is invalid',
          issues
        )
      }
    ];
  }
};
