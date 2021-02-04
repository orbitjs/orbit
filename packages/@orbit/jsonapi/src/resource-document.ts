import { Dict } from '@orbit/utils';
import { Link } from '@orbit/records';

export interface ResourceIdentity {
  id: string;
  type: string;
}

export interface ResourceHasOneRelationship {
  data?: ResourceIdentity | null;
  meta?: Dict<unknown>;
  links?: Dict<Link>;
}

export interface ResourceHasManyRelationship {
  data?: ResourceIdentity[];
  meta?: Dict<unknown>;
  links?: Dict<Link>;
}

export type ResourceRelationship =
  | ResourceHasOneRelationship
  | ResourceHasManyRelationship;

export interface Resource {
  id?: string;
  type: string;
  attributes?: Dict<unknown>;
  relationships?: Dict<ResourceRelationship>;
  meta?: Dict<unknown>;
  links?: Dict<Link>;
}

export type PrimaryResourceData =
  | Resource
  | Resource[]
  | ResourceIdentity
  | ResourceIdentity[]
  | null;

export interface ResourceDocument {
  data: PrimaryResourceData;
  included?: Resource[];
  links?: Dict<Link>;
  meta?: Dict<unknown>;
}
