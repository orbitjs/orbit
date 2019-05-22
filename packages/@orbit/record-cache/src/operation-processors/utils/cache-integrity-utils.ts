import { isArray } from '@orbit/utils';
import {
  cloneRecordIdentity,
  Record,
  RecordIdentity,
  RecordOperation,
  Schema
} from '@orbit/data';
import { RecordRelationshipIdentity } from '../../record-accessor';

export function getInverseRelationship(schema: Schema, record: RecordIdentity, relationship: string, relatedRecord: RecordIdentity): RecordRelationshipIdentity {
  if (relatedRecord) {
    const relationshipDef = schema.getModel(record.type).relationships[relationship];
    if (relationshipDef.inverse) {
      return {
        record,
        relationship,
        relatedRecord
      };
    }
  }
}

export function getInverseRelationships(schema: Schema, record: RecordIdentity, relationship: string, relatedRecords: RecordIdentity[]): RecordRelationshipIdentity[] {
  if (relatedRecords && relatedRecords.length > 0) {
    const relationshipDef = schema.getModel(record.type).relationships[relationship];
    if (relationshipDef.inverse) {
      const recordIdentity = cloneRecordIdentity(record);

      return relatedRecords.map(relatedRecord => {
        return {
          record: recordIdentity,
          relationship,
          relatedRecord
        };
      });
    }
  }
}

export function getAllInverseRelationships(record: Record): RecordRelationshipIdentity[] {
  const relationships = record && record.relationships;
  if (relationships) {
    const recordIdentity = cloneRecordIdentity(record);
    const inverseRelationships: RecordRelationshipIdentity[] = [];

    Object.keys(relationships).forEach(relationship => {
      const relationshipData = relationships[relationship] && relationships[relationship].data;
      if (relationshipData) {
        if (isArray(relationshipData)) {
          const relatedRecords = relationshipData as Record[];
          relatedRecords.forEach(relatedRecord => {
            inverseRelationships.push({
              record: recordIdentity,
              relationship,
              relatedRecord
            });
          });
        } else {
          const relatedRecord = relationshipData as Record;
          inverseRelationships.push({
            record: recordIdentity,
            relationship,
            relatedRecord
          });
        }
      }
    });

    return inverseRelationships;
  }
}

export function getInverseRelationshipRemovalOps(schema: Schema, inverseRelationships: RecordRelationshipIdentity[]): RecordOperation[] {
  const ops: RecordOperation[] = [];

  if (inverseRelationships && inverseRelationships.length > 0) {
    inverseRelationships.forEach(rel => {
      const relationshipDef = schema.getModel(rel.record.type).relationships[rel.relationship];
      if (relationshipDef.type === 'hasMany') {
        ops.push({
          op: 'removeFromRelatedRecords',
          record: rel.record,
          relationship: rel.relationship,
          relatedRecord: rel.relatedRecord
        });
      } else {
        ops.push({
          op: 'replaceRelatedRecord',
          record: rel.record,
          relationship: rel.relationship,
          relatedRecord: null
        });
      }
    });
  }

  return ops;
}
