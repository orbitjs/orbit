import { Dict } from '@orbit/utils';
import { Operation } from '../../src/operation';
import { OperationTerm } from '../../src/operation-term';
import { QueryExpression } from '../../src/query-expression';
import { QueryTerm } from '../../src/query-term';

export interface RecordIdentity {
  id: string;
  type: string;
}

export interface Record {
  id: string;
  type: string;
  attributes?: Dict<any>;
}

export type RecordData = Record | Record[] | undefined;

export interface AddRecordOperation extends Operation {
  op: 'addRecord';
  record: Record;
}

export interface UpdateRecordOperation extends Operation {
  op: 'updateRecord';
  record: Record;
}

export interface RemoveRecordOperation extends Operation {
  op: 'removeRecord';
  record: RecordIdentity;
}

export type RecordOperation =
  | AddRecordOperation
  | UpdateRecordOperation
  | RemoveRecordOperation;

export interface FindRecord extends QueryExpression {
  op: 'findRecord';
  record: RecordIdentity;
}

export interface FindRecords extends QueryExpression {
  op: 'findRecords';
  type: string;
}

export type RecordQueryExpression = FindRecord | FindRecords;

export interface RecordResponse {
  data: RecordData;
  meta?: unknown;
  links?: unknown;
}

export class AddRecordTerm extends OperationTerm<AddRecordOperation> {
  constructor(record: RecordIdentity) {
    const operation: AddRecordOperation = {
      op: 'addRecord',
      record
    };

    super(operation);
  }
}

export class RecordTransformBuilder {
  addRecord(record: Record): AddRecordTerm {
    return new AddRecordTerm(record);
  }
}

export class FindRecordsTerm extends QueryTerm<FindRecords> {
  constructor(type: string) {
    let expression: FindRecords = {
      op: 'findRecords',
      type
    };

    super(expression);
  }
}

export class RecordQueryBuilder {
  findRecords(type: string): FindRecordsTerm {
    return new FindRecordsTerm(type);
  }
}
