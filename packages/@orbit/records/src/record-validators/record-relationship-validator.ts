import { Assertion } from '@orbit/core';
import {
  ArrayValidator,
  formatValidationDescription,
  StandardValidator,
  StandardValidators,
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
import { RelatedRecordValidator } from './related-record-validator';
import {
  StandardRecordValidator,
  StandardRecordValidators
} from './standard-record-validators';

interface BaseIssue extends ValidationIssue {
  validator: StandardRecordValidators.RecordRelationship;
  ref: {
    record: RecordIdentity;
    relationship: string;
    data?: RecordIdentity[] | RecordIdentity | null;
  };
}

interface RequiredIssue extends BaseIssue {
  validation: 'dataRequired';
}

interface NotNullIssue extends BaseIssue {
  validation: 'dataNotNull';
}

interface DataValidIssue extends BaseIssue {
  validation: 'dataValid';
  details?: ValidationIssue[];
}

export interface RecordRelationshipInput {
  record: RecordIdentity;
  relationship: string;
  data: RecordIdentity[] | RecordIdentity | null;
}

export type RecordRelationshipValidationIssue =
  | RecordFieldDefinitionIssue
  | RequiredIssue
  | NotNullIssue
  | DataValidIssue;

export interface RecordRelationshipValidationOptions {
  validatorFor: ValidatorForFn<StandardValidator | StandardRecordValidator>;
  schema: RecordSchema;
  relationshipDef?: RelationshipDefinition;
}

export type RecordRelationshipValidator = Validator<
  RecordRelationshipInput,
  RecordRelationshipValidationOptions,
  RecordRelationshipValidationIssue
>;

export const validateRecordRelationship: RecordRelationshipValidator = (
  input: RecordRelationshipInput,
  options?: RecordRelationshipValidationOptions
): undefined | RecordRelationshipValidationIssue[] => {
  if (options?.validatorFor === undefined || options?.schema === undefined) {
    throw new Assertion(
      'validateRecordRelationship requires both a `validatorFor` and `schema`'
    );
  }

  const { record, relationship, data } = input;
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

  // Validate data
  if (data === undefined) {
    if (relationshipDef.validation?.required) {
      return [
        {
          validator: StandardRecordValidators.RecordRelationship,
          validation: 'dataRequired',
          description: 'data is required',
          ref: {
            record,
            relationship,
            data
          }
        }
      ];
    }
  } else {
    const dataIssues: ValidationIssue[] = [];

    const validateRelatedRecord = validatorFor(
      StandardRecordValidators.RelatedRecord
    ) as RelatedRecordValidator;

    if (relationshipDef.kind === 'hasMany') {
      if (!Array.isArray(data)) {
        return [
          {
            validator: StandardRecordValidators.RecordRelationship,
            ref: {
              record,
              relationship,
              data
            },
            validation: 'dataValid',
            description: 'data for a hasMany relationship must be an array'
          }
        ];
      } else {
        if (relationshipDef.validation) {
          // Validate any array constraints
          const validateArray = validatorFor(
            StandardValidators.Array
          ) as ArrayValidator;
          const arrayIssues = validateArray(data, relationshipDef.validation);

          if (arrayIssues) dataIssues.push(...arrayIssues);
        }

        for (let identity of data) {
          let issues = validateRelatedRecord(
            {
              record,
              relationship,
              relatedRecord: identity
            },
            {
              validatorFor,
              schema,
              relationshipDef
            }
          );
          if (issues) dataIssues.push(...issues);
        }
      }
    } else if (relationshipDef.kind === 'hasOne') {
      if (data === null) {
        if (relationshipDef.validation?.notNull) {
          return [
            {
              validator: StandardRecordValidators.RecordRelationship,
              validation: 'dataNotNull',
              description: 'data can not be null',
              ref: {
                record,
                relationship,
                data
              }
            }
          ];
        }
      } else {
        if (Array.isArray(data)) {
          return [
            {
              validator: StandardRecordValidators.RecordRelationship,
              ref: {
                record,
                relationship,
                data
              },
              validation: 'dataValid',
              description: 'data for a hasOne relationship can not be an array'
            }
          ];
        } else {
          let issues = validateRelatedRecord(
            {
              record,
              relationship,
              relatedRecord: data
            },
            {
              validatorFor,
              schema,
              relationshipDef
            }
          );
          if (issues) dataIssues.push(...issues);
        }
      }
    }

    if (dataIssues.length > 0) {
      return [
        {
          validator: StandardRecordValidators.RecordRelationship,
          ref: {
            record,
            relationship,
            data
          },
          validation: 'dataValid',
          details: dataIssues,
          description: formatValidationDescription(
            'relationship data is invalid',
            dataIssues
          )
        }
      ];
    }
  }
};
