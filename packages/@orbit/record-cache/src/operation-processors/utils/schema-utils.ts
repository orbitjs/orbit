import {
  ModelDefinition,
  ModelNotFound,
  RelationshipDefinition,
  RelationshipNotFound,
  RecordSchema
} from '@orbit/records';

export function getRelationshipDef(
  schema: RecordSchema,
  type: string,
  relationship: string
): RelationshipDefinition {
  const relationshipDef = schema.getRelationship(type, relationship);
  if (relationshipDef) {
    return relationshipDef;
  } else {
    throw new RelationshipNotFound(relationship, type);
  }
}

export function getModelDef(
  schema: RecordSchema,
  type: string
): ModelDefinition {
  const modelDef = schema.getModel(type);
  if (modelDef) {
    return modelDef;
  } else {
    throw new ModelNotFound(type);
  }
}
