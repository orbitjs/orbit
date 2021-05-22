import { ValidationIssue, ValidationOptions, Validator } from './validator';

interface BaseIssue extends ValidationIssue<Date> {
  validator: 'date';
}

interface TypeIssue extends BaseIssue {
  validation: 'type';
}

interface MinimumIssue extends BaseIssue {
  validation: 'minimum';
  details: {
    minimum: Date;
  };
}

interface MaximumIssue extends BaseIssue {
  validation: 'maximum';
  details: {
    maximum: Date;
  };
}

interface ExclusiveMinimumIssue extends BaseIssue {
  validation: 'exclusiveMinimum';
  details: {
    exclusiveMinimum: Date;
  };
}

interface ExclusiveMaximumIssue extends BaseIssue {
  validation: 'exclusiveMaximum';
  details: {
    exclusiveMaximum: Date;
  };
}

export type DateValidationIssue =
  | TypeIssue
  | MinimumIssue
  | MaximumIssue
  | ExclusiveMinimumIssue
  | ExclusiveMaximumIssue;

export interface DateValidationOptions extends ValidationOptions {
  minimum?: Date;
  maximum?: Date;
  exclusiveMinimum?: Date;
  exclusiveMaximum?: Date;
}

export type DateValidator = Validator<
  Date,
  DateValidationOptions,
  DateValidationIssue
>;

export const validateDate: DateValidator = (
  input: Date,
  options?: DateValidationOptions
): undefined | DateValidationIssue[] => {
  if (!(input instanceof Date)) {
    return [
      {
        validator: 'date',
        validation: 'type',
        description: 'is not a date',
        ref: input
      }
    ];
  }
  if (options?.minimum !== undefined && input < options.minimum) {
    return [
      {
        validator: 'date',
        validation: 'minimum',
        description: 'is too early',
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
        validator: 'date',
        validation: 'maximum',
        description: 'is too late',
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
        validator: 'date',
        validation: 'exclusiveMinimum',
        description: 'is too early',
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
        validator: 'date',
        validation: 'exclusiveMaximum',
        description: 'is too late',
        ref: input,
        details: {
          exclusiveMaximum: options.exclusiveMaximum
        }
      }
    ];
  }
};
