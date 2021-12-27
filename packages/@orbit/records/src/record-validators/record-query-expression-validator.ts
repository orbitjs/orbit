import { Assertion } from '@orbit/core';
import {
  formatValidationDescription,
  StandardValidator,
  ValidationIssue,
  Validator,
  ValidatorForFn
} from '@orbit/validators';
import {
  FindRecord,
  FindRecords,
  FindRelatedRecord,
  FindRelatedRecords,
  RecordQueryExpression
} from '../record-query-expression';
import { RecordSchema } from '../record-schema';
import { RecordFieldDefinitionValidator } from './record-field-definition-validator';
import { RecordIdentityValidator } from './record-identity-validator';
import { RecordTypeValidator } from './record-type-validator';
import {
  StandardRecordValidator,
  StandardRecordValidators
} from './standard-record-validators';

export interface RecordQueryExpressionValidationOptions {
  validatorFor: ValidatorForFn<StandardValidator | StandardRecordValidator>;
  schema: RecordSchema;
}

interface BaseIssue extends ValidationIssue {
  validator: StandardRecordValidators.RecordQueryExpression;
  ref: RecordQueryExpression;
}

interface QueryExpressionAllowedIssue extends BaseIssue {
  validation: 'queryExpressionAllowed';
}

interface QueryExpressionValidIssue extends BaseIssue {
  validation: 'queryExpressionValid';
  details: ValidationIssue[];
}

export type RecordQueryExpressionValidationIssue =
  | QueryExpressionAllowedIssue
  | QueryExpressionValidIssue;

export type RecordQueryExpressionValidator = Validator<
  RecordQueryExpression,
  RecordQueryExpressionValidationOptions,
  RecordQueryExpressionValidationIssue
>;

function validateFindRecordQueryExpression(
  expression: FindRecord,
  options: {
    schema: RecordSchema;
    validatorFor: ValidatorForFn<StandardValidator | StandardRecordValidator>;
  }
): undefined | ValidationIssue[] {
  const { schema, validatorFor } = options;
  const validateRecordIdentity = validatorFor(
    StandardRecordValidators.RecordIdentity
  ) as RecordIdentityValidator;

  return validateRecordIdentity(expression.record, { schema, validatorFor });
}

function validateFindRelatedRecordQueryExpression(
  expression: FindRelatedRecord,
  options: {
    schema: RecordSchema;
    validatorFor: ValidatorForFn<StandardValidator | StandardRecordValidator>;
  }
): undefined | ValidationIssue[] {
  const { schema, validatorFor } = options;
  const issues: ValidationIssue[] = [];

  const validateRecordIdentity = validatorFor(
    StandardRecordValidators.RecordIdentity
  ) as RecordIdentityValidator;
  const recordIssues = validateRecordIdentity(expression.record, {
    schema,
    validatorFor
  });
  if (recordIssues) issues.push(...recordIssues);

  const validateRecordFieldDefinition = validatorFor(
    StandardRecordValidators.RecordFieldDefinition
  ) as RecordFieldDefinitionValidator;
  const fieldIssues = validateRecordFieldDefinition(
    {
      kind: 'relationship',
      type: expression.record.type,
      field: expression.relationship
    },
    { schema }
  );
  if (fieldIssues) issues.push(...fieldIssues);

  if (issues.length > 0) return issues;
}

function validateFindRelatedRecordsQueryExpression(
  expression: FindRelatedRecords,
  options: {
    schema: RecordSchema;
    validatorFor: ValidatorForFn<StandardValidator | StandardRecordValidator>;
  }
): undefined | ValidationIssue[] {
  const { schema, validatorFor } = options;
  const issues: ValidationIssue[] = [];

  const validateRecordIdentity = validatorFor(
    StandardRecordValidators.RecordIdentity
  ) as RecordIdentityValidator;
  const recordIssues = validateRecordIdentity(expression.record, {
    schema,
    validatorFor
  });
  if (recordIssues) issues.push(...recordIssues);

  const validateRecordFieldDefinition = validatorFor(
    StandardRecordValidators.RecordFieldDefinition
  ) as RecordFieldDefinitionValidator;
  const fieldIssues = validateRecordFieldDefinition(
    {
      kind: 'relationship',
      type: expression.record.type,
      field: expression.relationship
    },
    { schema }
  );
  if (fieldIssues) issues.push(...fieldIssues);

  // TODO - validate `sort`, `filter`, and `page`

  if (issues.length > 0) return issues;
}

function validateFindRecordsQueryExpression(
  expression: FindRecords,
  options: {
    schema: RecordSchema;
    validatorFor: ValidatorForFn<StandardValidator | StandardRecordValidator>;
  }
): undefined | ValidationIssue[] {
  const { schema, validatorFor } = options;
  const issues: ValidationIssue[] = [];

  if (expression.records) {
    const validateRecordIdentity = validatorFor(
      StandardRecordValidators.RecordIdentity
    ) as RecordIdentityValidator;

    expression.records.forEach((r) => {
      let i = validateRecordIdentity(r, {
        schema,
        validatorFor
      });
      if (i) issues.push(...i);
    });
  }

  if (expression.type) {
    const validateRecordType = validatorFor(
      StandardRecordValidators.RecordType
    ) as RecordTypeValidator;

    let i = validateRecordType(expression.type, {
      schema
    });
    if (i) issues.push(...i);
  }

  // TODO - validate `sort`, `filter`, and `page`

  if (issues.length > 0) return issues;
}

export const validateRecordQueryExpression: RecordQueryExpressionValidator = (
  expression: RecordQueryExpression,
  options?: {
    schema: RecordSchema;
    validatorFor: ValidatorForFn<StandardValidator | StandardRecordValidator>;
  }
): undefined | RecordQueryExpressionValidationIssue[] => {
  if (options?.validatorFor === undefined || options?.schema === undefined) {
    throw new Assertion(
      'validateRecordQueryExpression requires both a `validationFor` and a `schema`.'
    );
  }

  const { schema, validatorFor } = options;
  let issues;

  switch (expression.op) {
    case 'findRecord':
      issues = validateFindRecordQueryExpression(expression, {
        schema,
        validatorFor
      });
      break;

    case 'findRelatedRecord':
      issues = validateFindRelatedRecordQueryExpression(expression, {
        schema,
        validatorFor
      });
      break;

    case 'findRelatedRecords':
      issues = validateFindRelatedRecordsQueryExpression(expression, {
        schema,
        validatorFor
      });
      break;

    case 'findRecords':
      issues = validateFindRecordsQueryExpression(expression, {
        schema,
        validatorFor
      });
      break;

    default:
      return [
        {
          validator: StandardRecordValidators.RecordQueryExpression,
          validation: 'queryExpressionAllowed',
          ref: expression,
          description: `record query expression '${
            (expression as any).op
          }' is not recognized`
        }
      ];
  }

  if (issues !== undefined) {
    return [
      {
        validator: StandardRecordValidators.RecordQueryExpression,
        validation: 'queryExpressionValid',
        ref: expression,
        details: issues,
        description: formatValidationDescription(
          'record query expression is invalid',
          issues
        )
      }
    ];
  }
};
