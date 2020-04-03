import {
  cloneRecordIdentity,
  Record,
  RecordIdentity,
  RecordOperation,
  Schema
} from '@orbit/data';
import { deepGet } from '@orbit/utils';
import { RecordRelationshipIdentity } from '../../record-accessor';

export function getInverseRelationship(
  schema: Schema,
  record: RecordIdentity,
  relationship: string,
  relatedRecord?: RecordIdentity | null
): RecordRelationshipIdentity | null {
  if (relatedRecord) {
    const relationshipDef = schema.getRelationship(record.type, relationship);

    if (relationshipDef.inverse) {
      return {
        record,
        relationship,
        relatedRecord
      };
    }
  }
  return null;
}

export function getInverseRelationships(
  schema: Schema,
  record: RecordIdentity,
  relationship: string,
  relatedRecords?: RecordIdentity[]
): RecordRelationshipIdentity[] {
  if (relatedRecords && relatedRecords.length > 0) {
    const relationshipDef = schema.getRelationship(record.type, relationship);

    if (relationshipDef.inverse) {
      const recordIdentity = cloneRecordIdentity(record);

      return relatedRecords.map((relatedRecord) => {
        return {
          record: recordIdentity,
          relationship,
          relatedRecord
        };
      });
    }
  }
  return [];
}

export function getAllInverseRelationships(
  schema: Schema,
  record: Record
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
  schema: Schema,
  inverseRelationships: RecordRelationshipIdentity[]
): RecordOperation[] {
  const ops: RecordOperation[] = [];

  for (let inverseRelationship of inverseRelationships) {
    const relationshipDef = schema.getRelationship(
      inverseRelationship.record.type,
      inverseRelationship.relationship
    );

    if ((relationshipDef.kind || relationshipDef.type) === 'hasMany') {
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
