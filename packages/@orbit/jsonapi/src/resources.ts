import { Dict } from '@orbit/utils';
import { Link, Record } from '@orbit/data';

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

export type PrimaryResourceData =
  | Resource
  | Resource[]
  | ResourceIdentity
  | ResourceIdentity[];

export interface ResourceDocument {
  data: PrimaryResourceData;
  included?: Resource[];
  links?: Dict<Link>;
  meta?: Dict<any>;
}

export type PrimaryRecordData = Record | Record[] | null;

export interface RecordDocument {
  data: PrimaryRecordData;
  included?: Record[];
  links?: Dict<Link>;
  meta?: Dict<any>;
}
