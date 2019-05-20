/* eslint @typescript-eslint/no-empty-interface:off */
import { Dict } from '@orbit/utils';
import { Link } from '@orbit/data';

export interface ResourceIdentity {
  id: string;
  type: string;
}

export interface ResourceHasOneRelationship {
  data?: ResourceIdentity | null;
  meta?: Dict<any>;
  links?: Dict<Link>;
}

export interface ResourceHasManyRelationship {
  data?: ResourceIdentity[];
  meta?: Dict<any>;
  links?: Dict<Link>;
}

export type ResourceRelationship =
  | ResourceHasOneRelationship
  | ResourceHasManyRelationship;

export interface Resource {
  id?: string;
  type: string;
  attributes?: Dict<any>;
  relationships?: Dict<ResourceRelationship>;
  meta?: Dict<any>;
  links?: Dict<Link>;
}

export interface ResourceOperation {
  op: 'get' | 'add' | 'update' | 'remove';
  ref: {
    type: string;
    id?: string;
    relationship?: string;
  };
  data?: Resource | Resource[];
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
  data: Resource;
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

export interface ResourceDocument {
  data: Resource | Resource[] | ResourceIdentity | ResourceIdentity[];
  included?: Resource[];
  meta?: Dict<any>;
  links?: Dict<Link>;
}

export interface ResourceOperationsDocument {
  operations: ResourceOperation[];
}

/**
 * @deprecated
 */
export interface JSONAPIDocument extends ResourceDocument {}
