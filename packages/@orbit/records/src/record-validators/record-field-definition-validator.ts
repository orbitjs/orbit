import { Assertion } from '@orbit/core';
import { ValidationIssue, Validator } from '@orbit/validators';
import { RecordSchema } from '../record-schema';
import { StandardRecordValidators } from './standard-record-validators';

export interface RecordFieldDefinitionInput {
  kind: 'attribute' | 'key' | 'relationship';
  type: string;
  field: string;
}

export interface RecordFieldDefinitionIssue extends ValidationIssue {
  validator: StandardRecordValidators.RecordFieldDefinition;
  validation: 'fieldDefined';
  ref: RecordFieldDefinitionInput;
}

export interface RecordFieldDefinitionValidationOptions {
  schema: RecordSchema;
}

export type RecordFieldDefinitionValidator = Validator<
  RecordFieldDefinitionInput,
  RecordFieldDefinitionValidationOptions,
  RecordFieldDefinitionIssue
>;

export const validateRecordFieldDefinition: RecordFieldDefinitionValidator = (
  input: RecordFieldDefinitionInput,
  options?: RecordFieldDefinitionValidationOptions
): undefined | RecordFieldDefinitionIssue[] => {
  if (options?.schema === undefined) {
    throw new Assertion('validateRecordFieldDefinition requires a `schema`');
  }

  const { schema } = options;
  const { kind, type, field } = input;

  if (
    !(
      (kind === 'attribute' && schema.hasAttribute(type, field)) ||
      (kind === 'key' && schema.hasKey(type, field)) ||
      (kind === 'relationship' && schema.hasRelationship(type, field))
    )
  ) {
    return [
      {
        validator: StandardRecordValidators.RecordFieldDefinition,
        validation: 'fieldDefined',
        ref: input,
        description: `${kind} '${field}' for type '${type}' is not defined in schema`
      }
    ];
  }
};
