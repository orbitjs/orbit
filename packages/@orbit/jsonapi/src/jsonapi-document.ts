import { Dict } from '@orbit/utils';
import { RecordRelationshipLinks, RecordLinks } from '@orbit/data';



export interface ResourceIdentity {
  id: string;
  type: string;
}

export interface ResourceHasOneRelationship {
  data?: ResourceIdentity;
  meta?: any;
  links?: RecordRelationshipLinks;
}

export interface ResourceHasManyRelationship {
  data?: ResourceIdentity[];
  meta?: any;
  links?: RecordRelationshipLinks;
}

export type ResourceRelationship = ResourceHasOneRelationship | ResourceHasManyRelationship;

export interface Resource {
  id?: string;
  type: string;
  attributes?: Dict<any>;
  relationships?: Dict<ResourceRelationship>;
  meta?: any;
  links?: RecordLinks;
}

export interface JSONAPIDocument {
  data: Resource | Resource[] | ResourceIdentity | ResourceIdentity[];
  included?: Resource[];
  meta?: any;
}
