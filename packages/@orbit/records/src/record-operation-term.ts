import { OperationTerm } from '@orbit/data';
import {
  AddRecordOperation,
  UpdateRecordOperation,
  RemoveRecordOperation,
  ReplaceAttributeOperation,
  ReplaceKeyOperation,
  AddToRelatedRecordsOperation,
  RemoveFromRelatedRecordsOperation,
  ReplaceRelatedRecordsOperation,
  ReplaceRelatedRecordOperation,
  RecordOperation
} from './record-operation';
import {
  InitializedRecord,
  RecordIdentity,
  UninitializedRecord
} from './record';
import { RecordTransformBuilder } from './record-transform-builder';
import { StandardRecordValidators } from './record-validators/standard-record-validators';
import { RecordOperationValidator } from './record-validators/record-operation-validator';
import { RecordSchema } from './record-schema';
import { ValidationError } from './record-exceptions';

export class BaseRecordOperationTerm<
  O extends RecordOperation,
  RT = string,
  RI = RecordIdentity,
  R = UninitializedRecord
> extends OperationTerm<O> {
  $transformBuilder: RecordTransformBuilder<RT, RI, R>;

  constructor(
    transformBuilder: RecordTransformBuilder<RT, RI, R>,
    operation: O
  ) {
    super(operation);
    this.$transformBuilder = transformBuilder;
  }

  toOperation(): O {
    const operation = super.toOperation();

    const validatorFor = this.$transformBuilder.$validatorFor;
    if (validatorFor) {
      const schema = this.$transformBuilder.$schema as RecordSchema;

      const validateRecordOperation = validatorFor(
        StandardRecordValidators.RecordOperation
      ) as RecordOperationValidator;

      const issues = validateRecordOperation(operation, {
        validatorFor,
        schema
      });
      if (issues !== undefined) {
        throw new ValidationError(
          'Validation isssues encountered while building a transform operation',
          issues
        );
      }
    }

    return operation;
  }
}

export class AddRecordTerm<
  RT = string,
  RI = RecordIdentity,
  R = UninitializedRecord
> extends BaseRecordOperationTerm<AddRecordOperation, RT, RI, R> {
  constructor(
    transformBuilder: RecordTransformBuilder<RT, RI, R>,
    record: InitializedRecord
  ) {
    super(transformBuilder, {
      op: 'addRecord',
      record
    });
  }
}

export class UpdateRecordTerm<
  RT = string,
  RI = RecordIdentity,
  R = UninitializedRecord
> extends BaseRecordOperationTerm<UpdateRecordOperation, RT, RI, R> {
  constructor(
    transformBuilder: RecordTransformBuilder<RT, RI, R>,
    record: InitializedRecord
  ) {
    super(transformBuilder, {
      op: 'updateRecord',
      record
    });
  }
}

export class RemoveRecordTerm<
  RT = string,
  RI = RecordIdentity,
  R = UninitializedRecord
> extends BaseRecordOperationTerm<RemoveRecordOperation, RT, RI, R> {
  constructor(
    transformBuilder: RecordTransformBuilder<RT, RI, R>,
    record: RecordIdentity
  ) {
    super(transformBuilder, {
      op: 'removeRecord',
      record
    });
  }
}

export class ReplaceAttributeTerm<
  RT = string,
  RI = RecordIdentity,
  R = UninitializedRecord
> extends BaseRecordOperationTerm<ReplaceAttributeOperation, RT, RI, R> {
  constructor(
    transformBuilder: RecordTransformBuilder<RT, RI, R>,
    record: RecordIdentity,
    attribute: string,
    value: unknown
  ) {
    super(transformBuilder, {
      op: 'replaceAttribute',
      record,
      attribute,
      value
    });
  }
}

export class ReplaceKeyTerm<
  RT = string,
  RI = RecordIdentity,
  R = UninitializedRecord
> extends BaseRecordOperationTerm<ReplaceKeyOperation, RT, RI, R> {
  constructor(
    transformBuilder: RecordTransformBuilder<RT, RI, R>,
    record: RecordIdentity,
    key: string,
    value: string
  ) {
    super(transformBuilder, {
      op: 'replaceKey',
      record,
      key,
      value
    });
  }
}

export class AddToRelatedRecordsTerm<
  RT = string,
  RI = RecordIdentity,
  R = UninitializedRecord
> extends BaseRecordOperationTerm<AddToRelatedRecordsOperation, RT, RI, R> {
  constructor(
    transformBuilder: RecordTransformBuilder<RT, RI, R>,
    record: RecordIdentity,
    relationship: string,
    relatedRecord: RecordIdentity
  ) {
    super(transformBuilder, {
      op: 'addToRelatedRecords',
      record,
      relationship,
      relatedRecord
    });
  }
}

export class RemoveFromRelatedRecordsTerm<
  RT = string,
  RI = RecordIdentity,
  R = UninitializedRecord
> extends BaseRecordOperationTerm<
  RemoveFromRelatedRecordsOperation,
  RT,
  RI,
  R
> {
  constructor(
    transformBuilder: RecordTransformBuilder<RT, RI, R>,
    record: RecordIdentity,
    relationship: string,
    relatedRecord: RecordIdentity
  ) {
    super(transformBuilder, {
      op: 'removeFromRelatedRecords',
      record,
      relationship,
      relatedRecord
    });
  }
}

export class ReplaceRelatedRecordsTerm<
  RT = string,
  RI = RecordIdentity,
  R = UninitializedRecord
> extends BaseRecordOperationTerm<ReplaceRelatedRecordsOperation, RT, RI, R> {
  constructor(
    transformBuilder: RecordTransformBuilder<RT, RI, R>,
    record: RecordIdentity,
    relationship: string,
    relatedRecords: RecordIdentity[]
  ) {
    super(transformBuilder, {
      op: 'replaceRelatedRecords',
      record,
      relationship,
      relatedRecords
    });
  }
}

export class ReplaceRelatedRecordTerm<
  RT = string,
  RI = RecordIdentity,
  R = UninitializedRecord
> extends BaseRecordOperationTerm<ReplaceRelatedRecordOperation, RT, RI, R> {
  constructor(
    transformBuilder: RecordTransformBuilder<RT, RI, R>,
    record: RecordIdentity,
    relationship: string,
    relatedRecord: RecordIdentity | null
  ) {
    super(transformBuilder, {
      op: 'replaceRelatedRecord',
      record,
      relationship,
      relatedRecord
    });
  }
}

export type RecordOperationTerm<
  RT = string,
  RI = RecordIdentity,
  R = UninitializedRecord
> =
  | AddRecordTerm<RT, RI, R>
  | UpdateRecordTerm<RT, RI, R>
  | RemoveRecordTerm<RT, RI, R>
  | ReplaceKeyTerm<RT, RI, R>
  | ReplaceAttributeTerm<RT, RI, R>
  | AddToRelatedRecordsTerm<RT, RI, R>
  | RemoveFromRelatedRecordsTerm<RT, RI, R>
  | ReplaceRelatedRecordsTerm<RT, RI, R>
  | ReplaceRelatedRecordTerm<RT, RI, R>;
