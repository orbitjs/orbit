import { deepGet } from '@orbit/utils';
import {
  cloneRecordIdentity,
  equalRecordIdentities,
  uniqueRecordIdentities,
  InitializedRecord,
  RecordIdentity,
  RecordOperation,
  RelationshipDefinition,
  RecordSchema
} from '@orbit/records';

export function recordAdded(
  schema: RecordSchema,
  record: InitializedRecord
): RecordOperation[] {
  const ops: RecordOperation[] = [];

  if (record.relationships) {
    const recordIdentity = cloneRecordIdentity(record);

    schema.eachRelationship(record.type, (relationship, relationshipDef) => {
      const relationshipData = deepGet(record, [
        'relationships',
        relationship,
        'data'
      ]) as RecordIdentity | RecordIdentity[] | null | undefined;

      if (relationshipData) {
        const relatedRecords = recordArrayFromData(
          relationshipData
        ) as RecordIdentity[];

        Array.prototype.push.apply(
          ops,
          addRelatedRecordsOps(
            schema,
            recordIdentity,
            relationshipDef,
            relatedRecords
          )
        );
      }
    });
  }

  return ops;
}

export function relatedRecordAdded(
  schema: RecordSchema,
  record: RecordIdentity,
  relationship: string,
  relatedRecord: RecordIdentity
): RecordOperation[] {
  const ops: RecordOperation[] = [];

  if (relatedRecord) {
    const { type } = record;
    const relationshipDef = schema.getRelationship(type, relationship);
    const inverseRelationship = relationshipDef.inverse;

    if (inverseRelationship) {
      ops.push(
        addRelationshipOp(schema, relatedRecord, inverseRelationship, record)
      );
    }
  }

  return ops;
}

export function relatedRecordRemoved(
  schema: RecordSchema,
  record: RecordIdentity,
  relationship: string,
  relatedRecord: RecordIdentity,
  currentRelatedRecord?: RecordIdentity | null
): RecordOperation[] {
  const ops: RecordOperation[] = [];

  if (currentRelatedRecord) {
    const { type } = record;
    const relationshipDef = schema.getRelationship(type, relationship);
    const inverseRelationship = relationshipDef.inverse;

    if (inverseRelationship) {
      ops.push(
        removeRelationshipOp(schema, relatedRecord, inverseRelationship, record)
      );
    }
  }

  return ops;
}

export function relatedRecordReplaced(
  schema: RecordSchema,
  record: RecordIdentity,
  relationship: string,
  relatedRecord: RecordIdentity | null,
  currentRelatedRecord?: RecordIdentity | null
): RecordOperation[] {
  const ops: RecordOperation[] = [];

  if (
    !equalRecordIdentities(
      relatedRecord as RecordIdentity,
      currentRelatedRecord as RecordIdentity
    )
  ) {
    const { type } = record;
    const relationshipDef = schema.getRelationship(type, relationship);
    const inverseRelationship = relationshipDef.inverse;

    if (inverseRelationship) {
      if (currentRelatedRecord) {
        ops.push(
          removeRelationshipOp(
            schema,
            currentRelatedRecord,
            inverseRelationship,
            record
          )
        );
      }

      if (relatedRecord) {
        ops.push(
          addRelationshipOp(schema, relatedRecord, inverseRelationship, record)
        );
      }
    }
  }

  return ops;
}

export function relatedRecordsReplaced(
  schema: RecordSchema,
  record: RecordIdentity,
  relationship: string,
  relatedRecords: RecordIdentity[],
  currentRelatedRecords?: RecordIdentity[]
): RecordOperation[] {
  const ops: RecordOperation[] = [];
  const { type } = record;
  const relationshipDef = schema.getRelationship(type, relationship);

  let addedRecords: RecordIdentity[];

  if (currentRelatedRecords && currentRelatedRecords.length > 0) {
    let removedRecords = uniqueRecordIdentities(
      currentRelatedRecords,
      relatedRecords
    );
    Array.prototype.push.apply(
      ops,
      removeRelatedRecordsOps(schema, record, relationshipDef, removedRecords)
    );

    addedRecords = uniqueRecordIdentities(
      relatedRecords,
      currentRelatedRecords
    );
  } else {
    addedRecords = relatedRecords;
  }

  Array.prototype.push.apply(
    ops,
    addRelatedRecordsOps(schema, record, relationshipDef, addedRecords)
  );

  return ops;
}

export function recordRemoved(
  schema: RecordSchema,
  record?: InitializedRecord
): RecordOperation[] {
  const ops: RecordOperation[] = [];

  if (record && record.relationships) {
    const recordIdentity = cloneRecordIdentity(record);

    schema.eachRelationship(record.type, (relationship, relationshipDef) => {
      const relationshipData = deepGet(record, [
        'relationships',
        relationship,
        'data'
      ]) as RecordIdentity | RecordIdentity[] | null | undefined;

      if (relationshipData) {
        const relatedRecords = recordArrayFromData(
          relationshipData
        ) as RecordIdentity[];

        Array.prototype.push.apply(
          ops,
          removeRelatedRecordsOps(
            schema,
            recordIdentity,
            relationshipDef,
            relatedRecords
          )
        );
      }
    });
  }

  return ops;
}

export function recordUpdated(
  schema: RecordSchema,
  record: InitializedRecord,
  currentRecord?: InitializedRecord
): RecordOperation[] {
  const ops: RecordOperation[] = [];

  if (record.relationships) {
    const recordIdentity = cloneRecordIdentity(record);

    schema.eachRelationship(record.type, (relationship, relationshipDef) => {
      const relationshipData = deepGet(record, [
        'relationships',
        relationship,
        'data'
      ]) as RecordIdentity | RecordIdentity[] | null | undefined;

      const currentRelationshipData =
        currentRecord &&
        (deepGet(currentRecord, ['relationships', relationship, 'data']) as
          | RecordIdentity
          | RecordIdentity[]
          | null
          | undefined);

      if (relationshipData !== undefined) {
        // TODO - remove deprecated `type` check
        if (
          (relationshipDef.kind ?? (relationshipDef as any).type) === 'hasMany'
        ) {
          Array.prototype.push.apply(
            ops,
            relatedRecordsReplaced(
              schema,
              recordIdentity,
              relationship,
              (relationshipData as RecordIdentity[]) || [],
              (currentRelationshipData as RecordIdentity[]) || []
            )
          );
        } else {
          Array.prototype.push.apply(
            ops,
            relatedRecordReplaced(
              schema,
              recordIdentity,
              relationship,
              (relationshipData as RecordIdentity) || null,
              (currentRelationshipData as RecordIdentity) || null
            )
          );
        }
      }
    });
  }

  return ops;
}

function addRelatedRecordsOps(
  schema: RecordSchema,
  record: RecordIdentity,
  relationshipDef: RelationshipDefinition,
  relatedRecords: RecordIdentity[]
): RecordOperation[] {
  if (relatedRecords.length > 0 && relationshipDef.inverse) {
    const inverse = relationshipDef.inverse;
    return relatedRecords.map((relatedRecord) =>
      addRelationshipOp(schema, relatedRecord, inverse, record)
    );
  }
  return [];
}

export function removeRelatedRecordsOps(
  schema: RecordSchema,
  record: RecordIdentity,
  relationshipDef: RelationshipDefinition,
  relatedRecords: RecordIdentity[]
): RecordOperation[] {
  if (relatedRecords.length > 0) {
    if (relationshipDef.dependent === 'remove') {
      return removeDependentRecords(relatedRecords);
    } else if (relationshipDef.inverse) {
      const inverse = relationshipDef.inverse;
      return relatedRecords.map((relatedRecord) =>
        removeRelationshipOp(schema, relatedRecord, inverse, record)
      );
    }
  }
  return [];
}

export function addRelationshipOp(
  schema: RecordSchema,
  record: RecordIdentity,
  relationship: string,
  relatedRecord: RecordIdentity
): RecordOperation {
  const { type } = record;
  const relationshipDef = schema.getRelationship(type, relationship);
  // TODO - remove deprecated `type` check
  const isHasMany =
    (relationshipDef.kind ?? (relationshipDef as any).type) === 'hasMany';

  return {
    op: isHasMany ? 'addToRelatedRecords' : 'replaceRelatedRecord',
    record,
    relationship,
    relatedRecord
  } as RecordOperation;
}

export function removeRelationshipOp(
  schema: RecordSchema,
  record: RecordIdentity,
  relationship: string,
  relatedRecord: RecordIdentity
): RecordOperation {
  const { type } = record;
  const relationshipDef = schema.getRelationship(type, relationship);
  // TODO - remove deprecated `type` check
  const isHasMany =
    (relationshipDef.kind ?? (relationshipDef as any).type) === 'hasMany';

  return {
    op: isHasMany ? 'removeFromRelatedRecords' : 'replaceRelatedRecord',
    record,
    relationship,
    relatedRecord: isHasMany ? relatedRecord : null
  } as RecordOperation;
}

export function recordArrayFromData(
  data: RecordIdentity | RecordIdentity[] | null
): RecordIdentity[] {
  if (Array.isArray(data)) {
    return data;
  } else if (data) {
    return [data];
  } else {
    return [];
  }
}

function removeDependentRecords(
  relatedRecords: RecordIdentity[]
): RecordOperation[] {
  return relatedRecords.map(
    (record) =>
      ({
        op: 'removeRecord',
        record
      } as RecordOperation)
  );
}
