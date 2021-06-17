import { Assertion } from '@orbit/core';
import {
  StandardValidator,
  ValidationIssue,
  Validator,
  ValidatorForFn
} from '@orbit/validators';
import { RecordIdentity } from '../record';
import { AttributeDefinition, RecordSchema } from '../record-schema';
import {
  RecordFieldDefinitionIssue,
  RecordFieldDefinitionValidator
} from './record-field-definition-validator';
import {
  StandardRecordValidators,
  StandardRecordValidator
} from './standard-record-validators';

interface BaseIssue extends ValidationIssue {
  validator: StandardRecordValidators.RecordAttribute;
  ref: {
    record: RecordIdentity;
    attribute: string;
    value?: unknown;
  };
}

interface TypeIssue extends BaseIssue {
  validation: 'type';
}

interface ValueRequiredIssue extends BaseIssue {
  validation: 'valueRequired';
}

interface ValueNotNullIssue extends BaseIssue {
  validation: 'valueNotNull';
}

interface ValueValidIssue extends BaseIssue {
  validation: 'valueValid';
  details: ValidationIssue[];
}

export interface RecordAttributeInput {
  record: RecordIdentity;
  attribute: string;
  value: unknown;
}

export type RecordAttributeValidationIssue =
  | TypeIssue
  | RecordFieldDefinitionIssue
  | ValueRequiredIssue
  | ValueNotNullIssue
  | ValueValidIssue;

export interface RecordAttributeValidationOptions {
  validatorFor: ValidatorForFn<StandardValidator | StandardRecordValidator>;
  schema?: RecordSchema;
  attributeDef?: AttributeDefinition;
}

export type RecordAttributeValidator = Validator<
  RecordAttributeInput,
  RecordAttributeValidationOptions,
  RecordAttributeValidationIssue
>;

export const validateRecordAttribute: RecordAttributeValidator = (
  input: RecordAttributeInput,
  options?: RecordAttributeValidationOptions
): undefined | RecordAttributeValidationIssue[] => {
  if (options?.validatorFor === undefined) {
    throw new Assertion('validateRecordAttribute requires a `validatorFor`');
  }

  const { record, attribute, value } = input;
  const { type } = record;
  const { validatorFor, schema } = options;
  let { attributeDef } = options;

  // Validate attribute definition, if one is not provided
  if (attributeDef === undefined) {
    if (schema === undefined) {
      throw new Assertion(
        'validateRecordAttribute requires either a `schema` or `attributeDef`'
      );
    }

    const validateRecordFieldDefinition = validatorFor(
      StandardRecordValidators.RecordFieldDefinition
    ) as RecordFieldDefinitionValidator;

    const defIssues = validateRecordFieldDefinition(
      { kind: 'attribute', type, field: attribute },
      { schema }
    );
    if (defIssues) return defIssues;

    attributeDef = schema.getAttribute(type, attribute);
  }

  // Validate value
  if (value === undefined) {
    if (attributeDef.validation?.required) {
      return [
        {
          validator: StandardRecordValidators.RecordAttribute,
          validation: 'valueRequired',
          description: 'value is required',
          ref: {
            record,
            attribute,
            value
          }
        }
      ];
    }
  } else if (value === null) {
    if (attributeDef.validation?.notNull) {
      return [
        {
          validator: StandardRecordValidators.RecordAttribute,
          validation: 'valueNotNull',
          description: 'value can not be null',
          ref: {
            record,
            attribute,
            value
          }
        }
      ];
    }
  } else if (attributeDef.type) {
    const validateRecordValue = validatorFor(attributeDef.type) as Validator;

    if (validateRecordValue === undefined) {
      return [
        {
          validator: StandardRecordValidators.RecordAttribute,
          ref: {
            record,
            attribute,
            value
          },
          validation: 'type',
          description: `validator has not been provided for attribute '${attribute}' of \`type\` '${attributeDef.type}'`
        }
      ];
    } else {
      const valueIssues = validateRecordValue(value, attributeDef.validation);
      if (valueIssues) {
        return [
          {
            validator: StandardRecordValidators.RecordAttribute,
            ref: {
              record,
              attribute,
              value
            },
            validation: 'valueValid',
            description: 'value is invalid',
            details: valueIssues
          }
        ];
      }
    }
  }
};
