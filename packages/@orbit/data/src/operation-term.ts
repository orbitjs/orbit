import { deepMerge } from '@orbit/utils';
import {
  Operation,
  AddRecordOperation,
  UpdateRecordOperation,
  RemoveRecordOperation,
  ReplaceAttributeOperation,
  ReplaceKeyOperation,
  AddToRelatedRecordsOperation,
  RemoveFromRelatedRecordsOperation,
  ReplaceRelatedRecordsOperation,
  ReplaceRelatedRecordOperation
} from './operation';
import { RequestOptions } from './request';
import { RecordIdentity } from './record';

/**
 * Operation terms are used by transform builders to allow for the construction of
 * operations in composable patterns.
 */
export class OperationTerm {
  operation: Operation;

  constructor(operation?: Operation) {
    this.operation = operation;
  }

  toOperation(): Operation {
    return this.operation;
  }

  options(options: RequestOptions): this {
    this.operation.options = deepMerge(this.operation.options || {}, options);
    return this;
  }
}

export class AddRecordTerm extends OperationTerm {
  operation: AddRecordOperation;

  constructor(record: RecordIdentity) {
    const operation: AddRecordOperation = {
      op: 'addRecord',
      record
    };

    super(operation);
  }
}

export class UpdateRecordTerm extends OperationTerm {
  operation: UpdateRecordOperation;

  constructor(record: RecordIdentity) {
    const operation: UpdateRecordOperation = {
      op: 'updateRecord',
      record
    };

    super(operation);
  }
}

export class RemoveRecordTerm extends OperationTerm {
  operation: RemoveRecordOperation;

  constructor(record: RecordIdentity) {
    const operation: RemoveRecordOperation = {
      op: 'removeRecord',
      record
    };

    super(operation);
  }
}

export class ReplaceAttributeTerm extends OperationTerm {
  operation: ReplaceAttributeOperation;

  constructor(record: RecordIdentity, attribute: string, value: unknown) {
    const operation: ReplaceAttributeOperation = {
      op: 'replaceAttribute',
      record,
      attribute,
      value
    };

    super(operation);
  }
}

export class ReplaceKeyTerm extends OperationTerm {
  operation: ReplaceKeyOperation;

  constructor(record: RecordIdentity, key: string, value: string) {
    const operation: ReplaceKeyOperation = {
      op: 'replaceKey',
      record,
      key,
      value
    };

    super(operation);
  }
}

export class AddToRelatedRecordsTerm extends OperationTerm {
  operation: AddToRelatedRecordsOperation;

  constructor(
    record: RecordIdentity,
    relationship: string,
    relatedRecord: RecordIdentity
  ) {
    const operation: AddToRelatedRecordsOperation = {
      op: 'addToRelatedRecords',
      record,
      relationship,
      relatedRecord
    };

    super(operation);
  }
}

export class RemoveFromRelatedRecordsTerm extends OperationTerm {
  operation: RemoveFromRelatedRecordsOperation;

  constructor(
    record: RecordIdentity,
    relationship: string,
    relatedRecord: RecordIdentity
  ) {
    const operation: RemoveFromRelatedRecordsOperation = {
      op: 'removeFromRelatedRecords',
      record,
      relationship,
      relatedRecord
    };

    super(operation);
  }
}

export class ReplaceRelatedRecordsTerm extends OperationTerm {
  operation: ReplaceRelatedRecordsOperation;

  constructor(
    record: RecordIdentity,
    relationship: string,
    relatedRecords: RecordIdentity[]
  ) {
    const operation: ReplaceRelatedRecordsOperation = {
      op: 'replaceRelatedRecords',
      record,
      relationship,
      relatedRecords
    };

    super(operation);
  }
}

export class ReplaceRelatedRecordTerm extends OperationTerm {
  operation: ReplaceRelatedRecordOperation;

  constructor(
    record: RecordIdentity,
    relationship: string,
    relatedRecord: RecordIdentity | null
  ) {
    const operation: ReplaceRelatedRecordOperation = {
      op: 'replaceRelatedRecord',
      record,
      relationship,
      relatedRecord
    };

    super(operation);
  }
}
