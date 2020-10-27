import { Resource } from './resource-document';
import { Dict } from '@orbit/utils';
import { Link, RecordOperation, Record } from '@orbit/records';

export interface ResourceAtomicOperation {
  op: 'get' | 'add' | 'update' | 'remove';
  ref: {
    type: string;
    id?: string;
    relationship?: string;
  };
  data?: Resource | Resource[] | null;
}

export interface AddResourceAtomicOperation extends ResourceAtomicOperation {
  op: 'add';
  ref: {
    type: string;
    id?: string;
  };
  data: Resource;
}

export interface UpdateResourceAtomicOperation extends ResourceAtomicOperation {
  op: 'update';
  ref: {
    type: string;
    id: string;
  };
  data: Resource;
}

export interface RemoveResourceAtomicOperation extends ResourceAtomicOperation {
  op: 'remove';
  ref: {
    type: string;
    id: string;
  };
}

export interface AddToRelatedResourcesAtomicOperation
  extends ResourceAtomicOperation {
  op: 'add';
  ref: {
    type: string;
    id: string;
    relationship: string;
  };
  data: Resource;
}

export interface RemoveFromRelatedResourcesAtomicOperation
  extends ResourceAtomicOperation {
  op: 'remove';
  ref: {
    type: string;
    id: string;
    relationship: string;
  };
  data: Resource;
}

export interface ReplaceRelatedResourceAtomicOperation
  extends ResourceAtomicOperation {
  op: 'update';
  ref: {
    type: string;
    id: string;
    relationship: string;
  };
  data: Resource | null;
}

export interface ReplaceRelatedResourcesAtomicOperation
  extends ResourceAtomicOperation {
  op: 'update';
  ref: {
    type: string;
    id: string;
    relationship: string;
  };
  data: Resource[];
}

export interface ResourceAtomicOperationsDocument {
  'atomic:operations': ResourceAtomicOperation[];
  links?: Dict<Link>;
  meta?: Dict<any>;
}

export interface ResourceAtomicResultsDocument {
  'atomic:results': Resource[];
  links?: Dict<Link>;
  meta?: Dict<any>;
}

export interface RecordOperationsDocument {
  operations: RecordOperation[];
  links?: Dict<Link>;
  meta?: Dict<any>;
}

export interface RecordResultsDocument {
  results: Record[];
  links?: Dict<Link>;
  meta?: Dict<any>;
}
