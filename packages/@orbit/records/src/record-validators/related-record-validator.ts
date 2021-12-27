import { Assertion } from '@orbit/core';
import {
  formatValidationDescription,
  StandardValidator,
  ValidationIssue,
  Validator,
  ValidatorForFn
} from '@orbit/validators';
import { RecordIdentity } from '../record';
import { RecordSchema, RelationshipDefinition } from '../record-schema';
import {
  RecordFieldDefinitionIssue,
  RecordFieldDefinitionValidator
} from './record-field-definition-validator';
import { RecordIdentityValidator } from './record-identity-validator';
import {
  StandardRecordValidator,
  StandardRecordValidators
} from './standard-record-validators';

interface BaseIssue extends ValidationIssue {
  validator: StandardRecordValidators.RelatedRecord;
  ref: {
    record: RecordIdentity;
    relationship: string;
    relatedRecord?: RecordIdentity;
  };
}

interface RelatedRecordValidIssue extends BaseIssue {
  validation: 'relatedRecordValid';
  details: ValidationIssue[];
}

interface RelatedRecordTypeIssue extends BaseIssue {
  validation: 'relatedRecordType';
  details: {
    allowedTypes: string[];
  };
}

export interface RelatedRecordInput {
  record: RecordIdentity;
  relationship: string;
  relatedRecord: RecordIdentity;
}

export type RelatedRecordValidationIssue =
  | RecordFieldDefinitionIssue
  | RelatedRecordValidIssue
  | RelatedRecordTypeIssue;

export interface RelatedRecordValidationOptions {
  validatorFor: ValidatorForFn<StandardValidator | StandardRecordValidator>;
  schema: RecordSchema;
  relationshipDef?: RelationshipDefinition;
}

export type RelatedRecordValidator = Validator<
  RelatedRecordInput,
  RelatedRecordValidationOptions,
  RelatedRecordValidationIssue
>;

export const validateRelatedRecord: RelatedRecordValidator = (
  input: RelatedRecordInput,
  options?: RelatedRecordValidationOptions
): undefined | RelatedRecordValidationIssue[] => {
  if (options?.validatorFor === undefined || options?.schema === undefined) {
    throw new Assertion(
      'validateRelatedRecord requires both a `validatorFor` and `schema`'
    );
  }

  const { record, relationship, relatedRecord } = input;
  const { type } = record;
  const { validatorFor, schema } = options;
  let { relationshipDef } = options;

  // Validate relationship definition, if one is not provided
  if (relationshipDef === undefined) {
    const validateRecordFieldDefinition = validatorFor(
      StandardRecordValidators.RecordFieldDefinition
    ) as RecordFieldDefinitionValidator;

    const defIssues = validateRecordFieldDefinition(
      { kind: 'relationship', type, field: relationship },
      { schema }
    );
    if (defIssues) return defIssues;

    relationshipDef = schema.getRelationship(type, relationship);
  }

  // Validate that relatedRecord is a valid record identity
  const validateRecordIdentity = validatorFor(
    StandardRecordValidators.RecordIdentity
  ) as RecordIdentityValidator;
  const relatedRecordIssues = validateRecordIdentity(relatedRecord, {
    schema,
    validatorFor
  });
  if (relatedRecordIssues) {
    return [
      {
        validator: StandardRecordValidators.RelatedRecord,
        validation: 'relatedRecordValid',
        ref: {
          record,
          relationship,
          relatedRecord
        },
        details: relatedRecordIssues,
        description: formatValidationDescription(
          'relatedRecord is not a valid record identity',
          relatedRecordIssues
        )
      }
    ];
  }

  // Validate that relatedRecord.type is allowed in relationship
  const allowedType = relationshipDef.type;
  if (allowedType) {
    const relatedType = relatedRecord.type;
    const allowedTypes = Array.isArray(allowedType)
      ? allowedType
      : [allowedType];
    if (!allowedTypes.includes(relatedType)) {
      return [
        {
          validator: StandardRecordValidators.RelatedRecord,
          validation: 'relatedRecordType',
          ref: {
            record,
            relationship,
            relatedRecord
          },
          details: {
            allowedTypes
          },
          description: `relatedRecord has a type '${relatedType}' which is not an allowed type for this relationship`
        }
      ];
    }
  }
};
