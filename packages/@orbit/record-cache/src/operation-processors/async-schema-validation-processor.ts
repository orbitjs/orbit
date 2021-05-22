import { Assertion } from '@orbit/core';
import {
  RecordOperation,
  RecordSchema,
  StandardRecordValidator,
  validateRecordOperation,
  ValidationError
} from '@orbit/records';
import { StandardValidator, ValidatorForFn } from '@orbit/validators';
import { AsyncOperationProcessor } from '../async-operation-processor';
import { AsyncRecordAccessor } from '../record-accessor';
import { RecordCache } from '../record-cache';

/**
 * An operation processor that ensures that an operation is compatible with
 * its associated schema.
 */
export class AsyncSchemaValidationProcessor extends AsyncOperationProcessor {
  schema: RecordSchema;
  validatorFor: ValidatorForFn<StandardValidator | StandardRecordValidator>;

  constructor(accessor: AsyncRecordAccessor) {
    super(accessor);

    const cache = (this.accessor as unknown) as RecordCache;
    const { schema, validatorFor } = cache;
    if (validatorFor === undefined || schema === undefined) {
      throw new Assertion(
        'SyncSchemaValidationProcessor requires a RecordCache with both a `validationFor` and a `schema`.'
      );
    }

    this.schema = schema;
    this.validatorFor = validatorFor;
  }

  async validate(operation: RecordOperation): Promise<void> {
    const { schema, validatorFor } = this;
    const issues = validateRecordOperation(operation, { schema, validatorFor });
    if (issues) {
      throw new ValidationError('Validation failed', issues);
    }
  }
}
