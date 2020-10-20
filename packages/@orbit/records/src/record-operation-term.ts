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
  ReplaceRelatedRecordOperation
} from './record-operation';
import { RecordIdentity } from './record';

export class AddRecordTerm extends OperationTerm<AddRecordOperation> {
  constructor(record: RecordIdentity) {
    const operation: AddRecordOperation = {
      op: 'addRecord',
      record
    };

    super(operation);
  }
}

export class UpdateRecordTerm extends OperationTerm<UpdateRecordOperation> {
  constructor(record: RecordIdentity) {
    const operation: UpdateRecordOperation = {
      op: 'updateRecord',
      record
    };

    super(operation);
  }
}

export class RemoveRecordTerm extends OperationTerm<RemoveRecordOperation> {
  constructor(record: RecordIdentity) {
    const operation: RemoveRecordOperation = {
      op: 'removeRecord',
      record
    };

    super(operation);
  }
}

export class ReplaceAttributeTerm extends OperationTerm<
  ReplaceAttributeOperation
> {
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

export class ReplaceKeyTerm extends OperationTerm<ReplaceKeyOperation> {
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

export class AddToRelatedRecordsTerm extends OperationTerm<
  AddToRelatedRecordsOperation
> {
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

export class RemoveFromRelatedRecordsTerm extends OperationTerm<
  RemoveFromRelatedRecordsOperation
> {
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

export class ReplaceRelatedRecordsTerm extends OperationTerm<
  ReplaceRelatedRecordsOperation
> {
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

export class ReplaceRelatedRecordTerm extends OperationTerm<
  ReplaceRelatedRecordOperation
> {
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

export type RecordOperationTerm =
  | AddRecordTerm
  | UpdateRecordTerm
  | RemoveRecordTerm
  | ReplaceKeyTerm
  | ReplaceAttributeTerm
  | AddToRelatedRecordsTerm
  | RemoveFromRelatedRecordsTerm
  | ReplaceRelatedRecordsTerm
  | ReplaceRelatedRecordTerm;
