import { ValidationIssue, ValidationOptions, Validator } from './validator';

interface BaseIssue extends ValidationIssue<unknown[]> {
  validator: 'array';
}

interface TypeIssue extends BaseIssue {
  validation: 'type';
}

interface MinItemsIssue extends BaseIssue {
  validation: 'minItems';
  details: {
    minItems: number;
  };
}

interface MaxItemsIssue extends BaseIssue {
  validation: 'maxItems';
  details: {
    maxItems: number;
  };
}

export type ArrayValidationIssue = TypeIssue | MinItemsIssue | MaxItemsIssue;

export interface ArrayValidationOptions extends ValidationOptions {
  minItems?: number;
  maxItems?: number;
}

export type ArrayValidator = Validator<
  unknown[],
  ArrayValidationOptions,
  ArrayValidationIssue
>;

export const validateArray: ArrayValidator = (
  input: unknown[],
  options?: ArrayValidationOptions
): undefined | ArrayValidationIssue[] => {
  if (!Array.isArray(input)) {
    return [
      {
        validator: 'array',
        validation: 'type',
        description: 'is not an array',
        ref: input
      }
    ];
  }
  if (options?.minItems !== undefined && input.length < options.minItems) {
    return [
      {
        validator: 'array',
        validation: 'minItems',
        description: 'has too few members',
        ref: input,
        details: {
          minItems: options.minItems
        }
      }
    ];
  }
  if (options?.maxItems !== undefined && input.length > options.maxItems) {
    return [
      {
        validator: 'array',
        validation: 'maxItems',
        description: 'has too many members',
        ref: input,
        details: {
          maxItems: options.maxItems
        }
      }
    ];
  }
};
