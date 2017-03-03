import { Dict } from '@orbit/utils';

export interface ResourceIdentity {
  id: string;
  type: string;
}

export interface ResourceHasOneRelationship {
  data?: ResourceIdentity;
  meta?: any;
}

export interface ResourceHasManyRelationship {
  data?: ResourceIdentity[];
  meta?: any;
}

export type ResourceRelationship = ResourceHasOneRelationship | ResourceHasManyRelationship;

export interface Resource {
  id?: string;
  type: string;
  attributes?: Dict<any>;
  relationships?: Dict<ResourceRelationship>;
  meta?: any;
}

export interface JSONAPIDocument {
  data: Resource | Resource[] | ResourceIdentity | ResourceIdentity[];
  included?: Resource[];
  meta?: any;
}
