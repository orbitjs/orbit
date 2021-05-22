import {
  cloneRecordIdentity,
  InitializedRecord,
  RecordIdentity,
  RecordOperation,
  RecordSchema
} from '@orbit/records';
import { deepGet } from '@orbit/utils';
import { RecordRelationshipIdentity } from '../../record-accessor';

export function getInverseRelationship(
  schema: RecordSchema,
  record: RecordIdentity,
  relationship: string,
  relatedRecord?: RecordIdentity | null
): RecordRelationshipIdentity | null {
  if (relatedRecord) {
    const recordIdentity = cloneRecordIdentity(record);

    return {
      record: recordIdentity,
      relationship,
      relatedRecord
    };
  }
  return null;
}

export function getInverseRelationships(
  schema: RecordSchema,
  record: RecordIdentity,
  relationship: string,
  relatedRecords?: RecordIdentity[]
): RecordRelationshipIdentity[] {
  if (relatedRecords && relatedRecords.length > 0) {
    const recordIdentity = cloneRecordIdentity(record);

    return relatedRecords.map((relatedRecord) => {
      return {
        record: recordIdentity,
        relationship,
        relatedRecord
      };
    });
  }
  return [];
}

export function getAllInverseRelationships(
  schema: RecordSchema,
  record: InitializedRecord
): RecordRelationshipIdentity[] {
  const recordIdentity = cloneRecordIdentity(record);
  const inverseRelationships: RecordRelationshipIdentity[] = [];

  schema.eachRelationship(record.type, (relationship) => {
    const relationshipData = deepGet(record, [
      'relationships',
      relationship,
      'data'
    ]) as RecordIdentity | RecordIdentity[] | null | undefined;

    if (Array.isArray(relationshipData)) {
      for (let relatedRecord of relationshipData) {
        inverseRelationships.push({
          record: recordIdentity,
          relationship,
          relatedRecord
        });
      }
    } else if (relationshipData) {
      inverseRelationships.push({
        record: recordIdentity,
        relationship,
        relatedRecord: relationshipData
      });
    }
  });

  return inverseRelationships;
}

export function getInverseRelationshipRemovalOps(
  schema: RecordSchema,
  inverseRelationships: RecordRelationshipIdentity[]
): RecordOperation[] {
  const ops: RecordOperation[] = [];

  for (let inverseRelationship of inverseRelationships) {
    const { type } = inverseRelationship.record;
    const { relationship } = inverseRelationship;
    const relationshipDef = schema.getRelationship(type, relationship);

    // TODO - remove deprecated `type` check
    if ((relationshipDef.kind ?? (relationshipDef as any).type) === 'hasMany') {
      ops.push({
        op: 'removeFromRelatedRecords',
        record: inverseRelationship.record,
        relationship: inverseRelationship.relationship,
        relatedRecord: inverseRelationship.relatedRecord
      });
    } else {
      ops.push({
        op: 'replaceRelatedRecord',
        record: inverseRelationship.record,
        relationship: inverseRelationship.relationship,
        relatedRecord: null
      });
    }
  }

  return ops;
}
