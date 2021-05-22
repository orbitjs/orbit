import { ValidationIssue, ValidationOptions, Validator } from './validator';

interface BaseIssue extends ValidationIssue<number> {
  validator: 'number';
}

interface TypeIssue extends BaseIssue {
  validation: 'type';
}

interface MinimumIssue extends BaseIssue {
  validation: 'minimum';
  details: {
    minimum: number;
  };
}

interface MaximumIssue extends BaseIssue {
  validation: 'maximum';
  details: {
    maximum: number;
  };
}

interface ExclusiveMinimumIssue extends BaseIssue {
  validation: 'exclusiveMinimum';
  details: {
    exclusiveMinimum: number;
  };
}

interface ExclusiveMaximumIssue extends BaseIssue {
  validation: 'exclusiveMaximum';
  details: {
    exclusiveMaximum: number;
  };
}

export type NumberValidationIssue =
  | TypeIssue
  | MinimumIssue
  | MaximumIssue
  | ExclusiveMinimumIssue
  | ExclusiveMaximumIssue;

export interface NumberValidationOptions extends ValidationOptions {
  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: number;
  exclusiveMaximum?: number;
}

export type NumberValidator = Validator<
  number,
  NumberValidationOptions,
  NumberValidationIssue
>;

export const validateNumber: NumberValidator = (
  input: number,
  options?: NumberValidationOptions
): undefined | NumberValidationIssue[] => {
  if (typeof input !== 'number') {
    return [
      {
        validator: 'number',
        validation: 'type',
        description: 'is not a number',
        ref: input
      }
    ];
  }
  if (options?.minimum !== undefined && input < options.minimum) {
    return [
      {
        validator: 'number',
        validation: 'minimum',
        description: 'is too low',
        ref: input,
        details: {
          minimum: options.minimum
        }
      }
    ];
  }
  if (options?.maximum !== undefined && input > options.maximum) {
    return [
      {
        validator: 'number',
        validation: 'maximum',
        description: 'is too high',
        ref: input,
        details: {
          maximum: options.maximum
        }
      }
    ];
  }
  if (
    options?.exclusiveMinimum !== undefined &&
    input <= options.exclusiveMinimum
  ) {
    return [
      {
        validator: 'number',
        validation: 'exclusiveMinimum',
        description: 'is too low',
        ref: input,
        details: {
          exclusiveMinimum: options.exclusiveMinimum
        }
      }
    ];
  }
  if (
    options?.exclusiveMaximum !== undefined &&
    input >= options.exclusiveMaximum
  ) {
    return [
      {
        validator: 'number',
        validation: 'exclusiveMaximum',
        description: 'is too high',
        ref: input,
        details: {
          exclusiveMaximum: options.exclusiveMaximum
        }
      }
    ];
  }
};
