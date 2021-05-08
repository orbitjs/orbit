import { Assertion } from '@orbit/core';
import {
  StandardValidator,
  ValidationIssue,
  Validator,
  ValidatorForFn
} from '@orbit/validators';
import { RecordIdentity } from '../record';
import { ModelDefinition, RecordSchema } from '../record-schema';
import {
  RecordTypeValidationIssue,
  RecordTypeValidator
} from './record-type-validator';
import {
  StandardRecordValidator,
  StandardRecordValidators
} from './standard-record-validators';

interface BaseIssue extends ValidationIssue {
  validator: StandardRecordValidators.RecordIdentity;
  ref: RecordIdentity;
}

interface TypeIssue extends BaseIssue {
  validation: 'type';
}

export type RecordIdentityValidationIssue =
  | TypeIssue
  | RecordTypeValidationIssue;

export interface RecordIdentityValidationOptions {
  validatorFor: ValidatorForFn<StandardValidator | StandardRecordValidator>;
  schema?: RecordSchema;
  modelDef?: ModelDefinition;
}

export type RecordIdentityValidator = Validator<
  RecordIdentity,
  RecordIdentityValidationOptions,
  RecordIdentityValidationIssue
>;

export const validateRecordIdentity: RecordIdentityValidator = (
  record: RecordIdentity,
  options?: RecordIdentityValidationOptions
): undefined | RecordIdentityValidationIssue[] => {
  const { type, id } = record;

  if (typeof type !== 'string' || typeof id !== 'string') {
    return [
      {
        validator: StandardRecordValidators.RecordIdentity,
        validation: 'type',
        ref: record,
        description:
          'Record identities must be in the form `{ type, id }`, with string values for both `type` and `id`.'
      }
    ];
  }

  // Only check type if a `modelDef` has not been provided
  if (options?.modelDef === undefined) {
    if (options?.validatorFor === undefined || options?.schema === undefined) {
      throw new Assertion(
        'validateRecordIdentity requires either a `modelDef` or both a `validatorFor` and a `schema`'
      );
    }
    const { validatorFor, schema } = options;

    const validateRecordType = validatorFor(
      StandardRecordValidators.RecordType
    ) as RecordTypeValidator;

    return validateRecordType(type, { schema });
  }
};
