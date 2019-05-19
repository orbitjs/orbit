import { ResourceDocument } from '@orbit/jsonapi-serializer';

export { ResourceIdentity, ResourceHasOneRelationship, ResourceHasManyRelationship, ResourceRelationship, Resource } from '@orbit/jsonapi-serializer';
export { ResourceDocument };

/**
 * @deprecated
 */
export interface JSONAPIDocument extends ResourceDocument {};
