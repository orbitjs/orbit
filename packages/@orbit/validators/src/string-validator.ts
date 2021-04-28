import { ValidationIssue, ValidationOptions, Validator } from './validator';

interface BaseIssue extends ValidationIssue<string> {
  validator: 'string';
}

interface TypeIssue extends BaseIssue {
  validation: 'type';
}

interface MinLengthIssue extends BaseIssue {
  validation: 'minLength';
  details: {
    minLength: number;
  };
}

interface MaxLengthIssue extends BaseIssue {
  validation: 'maxLength';
  details: {
    maxLength: number;
  };
}

export type StringValidationIssue = TypeIssue | MinLengthIssue | MaxLengthIssue;

export interface StringValidationOptions extends ValidationOptions {
  minLength?: number;
  maxLength?: number;
}

export type StringValidator = Validator<
  string,
  StringValidationOptions,
  StringValidationIssue
>;

export const validateString: StringValidator = (
  input: string,
  options?: StringValidationOptions
): undefined | StringValidationIssue[] => {
  if (typeof input !== 'string') {
    return [
      {
        validator: 'string',
        validation: 'type',
        description: 'is not a string',
        ref: input
      }
    ];
  }
  if (options?.minLength !== undefined && input.length < options.minLength) {
    return [
      {
        validator: 'string',
        validation: 'minLength',
        description: 'is too short',
        ref: input,
        details: {
          minLength: options.minLength
        }
      }
    ];
  }
  if (options?.maxLength !== undefined && input.length > options.maxLength) {
    return [
      {
        validator: 'string',
        validation: 'maxLength',
        description: 'is too long',
        ref: input,
        details: {
          maxLength: options.maxLength
        }
      }
    ];
  }
};
