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

export type ResourceRelationship = ResourceHasOneRelationship | ResourceHasManyRelationship;

export interface Resource {
  id?: string;
  type: string;
  attributes?: Dict<any>;
  relationships?: Dict<ResourceRelationship>;
  meta?: Dict<any>;
  links?: Dict<Link>;
}

export interface JSONAPIDocument {
  data: Resource | Resource[] | ResourceIdentity | ResourceIdentity[];
  included?: Resource[];
  meta?: Dict<any>;
  links?: Dict<Link>;
}
