import { Resource } from './resources';
import { Dict } from '@orbit/utils';
import { Link, RecordOperation } from '@orbit/data';

export interface ResourceOperation {
  op: 'get' | 'add' | 'update' | 'remove';
  ref: {
    type: string;
    id?: string;
    relationship?: string;
  };
  data?: Resource | Resource[] | null;
}

export interface AddResourceOperation extends ResourceOperation {
  op: 'add';
  ref: {
    type: string;
    id?: string;
  };
  data: Resource;
}

export interface UpdateResourceOperation extends ResourceOperation {
  op: 'update';
  ref: {
    type: string;
    id: string;
  };
  data: Resource;
}

export interface RemoveResourceOperation extends ResourceOperation {
  op: 'remove';
  ref: {
    type: string;
    id: string;
  };
}

export interface AddToRelatedResourcesOperation extends ResourceOperation {
  op: 'add';
  ref: {
    type: string;
    id: string;
    relationship: string;
  };
  data: Resource;
}

export interface RemoveFromRelatedResourcesOperation extends ResourceOperation {
  op: 'remove';
  ref: {
    type: string;
    id: string;
    relationship: string;
  };
  data: Resource;
}

export interface ReplaceRelatedResourceOperation extends ResourceOperation {
  op: 'update';
  ref: {
    type: string;
    id: string;
    relationship: string;
  };
  data: Resource | null;
}

export interface ReplaceRelatedResourcesOperation extends ResourceOperation {
  op: 'update';
  ref: {
    type: string;
    id: string;
    relationship: string;
  };
  data: Resource[];
}

export interface ResourceOperationsDocument {
  links?: Dict<Link>;
  meta?: Dict<any>;
  operations: ResourceOperation[];
}

export interface RecordOperationsDocument {
  links?: Dict<Link>;
  meta?: Dict<any>;
  operations: RecordOperation[];
}
