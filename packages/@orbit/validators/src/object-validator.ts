import { ValidationIssue, ValidationOptions, Validator } from './validator';

interface BaseIssue extends ValidationIssue<unknown> {
  validator: 'object';
}

interface TypeIssue extends BaseIssue {
  validation: 'type';
}
export type ObjectValidationIssue = TypeIssue;

export type ObjectValidationOptions = ValidationOptions;

export type ObjectValidator = Validator<
  unknown,
  ObjectValidationOptions,
  ObjectValidationIssue
>;

export const validateObject: ObjectValidator = (
  input: unknown,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  options?: ObjectValidationOptions
): undefined | ObjectValidationIssue[] => {
  if (typeof input !== 'object' || input === null) {
    return [
      {
        validator: 'object',
        validation: 'type',
        description: 'is not an object',
        ref: input
      }
    ];
  }
};
