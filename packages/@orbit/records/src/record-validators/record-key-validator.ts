import { Assertion } from '@orbit/core';
import {
  StandardValidator,
  ValidationIssue,
  Validator,
  ValidatorForFn
} from '@orbit/validators';
import { RecordIdentity } from '../record';
import { KeyDefinition, RecordSchema } from '../record-schema';
import {
  RecordFieldDefinitionIssue,
  RecordFieldDefinitionValidator
} from './record-field-definition-validator';
import {
  StandardRecordValidator,
  StandardRecordValidators
} from './standard-record-validators';

interface BaseIssue extends ValidationIssue {
  validator: StandardRecordValidators.RecordKey;
  ref: {
    record: RecordIdentity;
    key: string;
    value?: unknown;
  };
}

interface ValueRequiredIssue extends BaseIssue {
  validation: 'valueRequired';
}

interface ValueNotNullIssue extends BaseIssue {
  validation: 'valueNotNull';
}

interface ValueValidIssue extends BaseIssue {
  validation: 'valueValid';
}

export interface RecordKeyInput {
  record: RecordIdentity;
  key: string;
  value: string;
}

export type RecordKeyValidationIssue =
  | RecordFieldDefinitionIssue
  | ValueRequiredIssue
  | ValueNotNullIssue
  | ValueValidIssue;

export interface RecordKeyValidationOptions {
  validatorFor: ValidatorForFn<StandardValidator | StandardRecordValidator>;
  schema?: RecordSchema;
  keyDef?: KeyDefinition;
}

export type RecordKeyValidator = Validator<
  RecordKeyInput,
  RecordKeyValidationOptions,
  RecordKeyValidationIssue
>;

export const validateRecordKey: RecordKeyValidator = (
  input: RecordKeyInput,
  options?: RecordKeyValidationOptions
): undefined | RecordKeyValidationIssue[] => {
  if (options?.validatorFor === undefined) {
    throw new Assertion('validateRecordKey requires a `validatorFor`');
  }

  const { record, key, value } = input;
  const { type } = record;
  const { validatorFor, schema } = options;
  let { keyDef } = options;

  // Validate key definition, if one is not provided
  if (keyDef === undefined) {
    if (schema === undefined) {
      throw new Assertion(
        'validateRecordKey requires either a `schema` or `keyDef`'
      );
    }

    const validateRecordFieldDefinition = validatorFor(
      StandardRecordValidators.RecordFieldDefinition
    ) as RecordFieldDefinitionValidator;

    const defIssues = validateRecordFieldDefinition(
      { kind: 'key', type, field: key },
      { schema }
    );
    if (defIssues) return defIssues;

    keyDef = schema.getKey(type, key);
  }

  // Validate value
  if (value === undefined) {
    if (keyDef.validation?.required) {
      return [
        {
          validator: StandardRecordValidators.RecordKey,
          validation: 'valueRequired',
          description: 'value is required',
          ref: {
            record,
            key,
            value
          }
        }
      ];
    }
  } else if (value === null) {
    if (keyDef.validation?.notNull) {
      return [
        {
          validator: StandardRecordValidators.RecordKey,
          validation: 'valueNotNull',
          description: 'value can not be null',
          ref: {
            record,
            key,
            value
          }
        }
      ];
    }
  } else if (typeof value !== 'string') {
    return [
      {
        validator: StandardRecordValidators.RecordKey,
        ref: {
          record,
          key,
          value
        },
        validation: 'valueValid',
        description: 'value is invalid'
      }
    ];
  }
};
