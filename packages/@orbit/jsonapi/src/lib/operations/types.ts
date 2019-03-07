import { Resource } from '@orbit/jsonapi';

export interface JSONAPIOperation {
  op: 'get' | 'add' | 'update' | 'remove';
  ref: {
    type: string;
    id?: string | number;
    relationship?: string;
  };
  data?: Resource | Resource[];
}

export interface JSONAPIOperationsPayload {
  operations: JSONAPIOperation[];
}
