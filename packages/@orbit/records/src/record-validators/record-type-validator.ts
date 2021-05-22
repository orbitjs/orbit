import { Assertion } from '@orbit/core';
import { ValidationIssue, Validator } from '@orbit/validators';
import { RecordSchema } from '../record-schema';
import { StandardRecordValidators } from './standard-record-validators';

interface BaseIssue extends ValidationIssue {
  validator: StandardRecordValidators.RecordType;
  ref: string;
}

interface TypeIssue extends BaseIssue {
  validation: 'type';
}

interface RecordTypeDefined extends BaseIssue {
  validation: 'recordTypeDefined';
}

export type RecordTypeValidationIssue = TypeIssue | RecordTypeDefined;

export interface RecordTypeValidationOptions {
  schema: RecordSchema;
}

export type RecordTypeValidator = Validator<
  string,
  RecordTypeValidationOptions,
  RecordTypeValidationIssue
>;

export const validateRecordType: RecordTypeValidator = (
  type: string,
  options?: RecordTypeValidationOptions
): undefined | RecordTypeValidationIssue[] => {
  if (typeof type !== 'string') {
    return [
      {
        validator: StandardRecordValidators.RecordType,
        validation: 'type',
        ref: type,
        description: 'Record `type` must be a string.'
      }
    ];
  } else {
    if (options?.schema === undefined) {
      throw new Assertion('validateRecordType requires a `schema`');
    }

    if (!options.schema.hasModel(type)) {
      // Return early if model is not defined in schema
      return [
        {
          validator: StandardRecordValidators.RecordType,
          validation: 'recordTypeDefined',
          ref: type,
          description: `Record type '${type}' does not exist in schema`
        }
      ];
    }
  }
};
