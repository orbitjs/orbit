import { ValidationIssue, Validator } from './validator';

interface BaseIssue extends ValidationIssue<boolean> {
  validator: 'boolean';
}

interface TypeIssue extends BaseIssue {
  validation: 'type';
}

export type BooleanValidationIssue = TypeIssue;

export type BooleanValidator = Validator<
  boolean,
  undefined,
  BooleanValidationIssue
>;

export const validateBoolean: BooleanValidator = (
  input: boolean
): undefined | BooleanValidationIssue[] => {
  if (typeof input !== 'boolean') {
    return [
      {
        validator: 'boolean',
        validation: 'type',
        description: 'is not a boolean',
        ref: input
      }
    ];
  }
};
