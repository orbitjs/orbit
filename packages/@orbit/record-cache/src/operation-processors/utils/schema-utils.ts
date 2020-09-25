import {
  ModelDefinition,
  ModelNotFound,
  RelationshipDefinition,
  RelationshipNotFound,
  Schema
} from '@orbit/data';

export function getRelationshipDef(
  schema: Schema,
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

export function getModelDef(schema: Schema, type: string): ModelDefinition {
  const modelDef = schema.getModel(type);
  if (modelDef) {
    return modelDef;
  } else {
    throw new ModelNotFound(type);
  }
}
