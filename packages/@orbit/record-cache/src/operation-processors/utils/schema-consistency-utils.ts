import { deepGet, isArray } from '@orbit/utils';
import {
  cloneRecordIdentity,
  equalRecordIdentities,
  uniqueRecordIdentities,
  Record,
  RecordIdentity,
  RecordOperation,
  RelationshipDefinition,
  Schema
} from '@orbit/data';

export function recordAdded(schema: Schema, record: Record): RecordOperation[] {
  const ops: RecordOperation[] = [];
  const relationships = record.relationships;

  if (relationships) {
    const modelDef = schema.getModel(record.type);
    const recordIdentity = cloneRecordIdentity(record);

    Object.keys(relationships).forEach(relationship => {
      const relationshipData =
        relationships[relationship] && relationships[relationship].data;

      if (relationshipData) {
        const relationshipDef = modelDef.relationships[relationship];
        const relatedRecords = recordArrayFromData(relationshipData);

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
  schema: Schema,
  record: RecordIdentity,
  relationship: string,
  relatedRecord: RecordIdentity
): RecordOperation[] {
  const ops: RecordOperation[] = [];

  if (relatedRecord) {
    const relationshipDef = schema.getModel(record.type).relationships[
      relationship
    ];
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
  schema: Schema,
  record: RecordIdentity,
  relationship: string,
  currentRelatedRecord: RecordIdentity,
  relatedRecord: RecordIdentity
): RecordOperation[] {
  const ops: RecordOperation[] = [];

  if (currentRelatedRecord && relatedRecord) {
    const relationshipDef = schema.getModel(record.type).relationships[
      relationship
    ];
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
  schema: Schema,
  record: RecordIdentity,
  relationship: string,
  currentRelatedRecord: RecordIdentity,
  relatedRecord: RecordIdentity
): RecordOperation[] {
  const ops: RecordOperation[] = [];

  if (!equalRecordIdentities(relatedRecord, currentRelatedRecord)) {
    const relationshipDef = schema.getModel(record.type).relationships[
      relationship
    ];
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
  schema: Schema,
  record: RecordIdentity,
  relationship: string,
  currentRelatedRecords: RecordIdentity[],
  relatedRecords: RecordIdentity[]
): RecordOperation[] {
  const ops: RecordOperation[] = [];
  const relationshipDef = schema.getModel(record.type).relationships[
    relationship
  ];

  let addedRecords;

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
  schema: Schema,
  record: Record
): RecordOperation[] {
  const ops: RecordOperation[] = [];
  const relationships = record && record.relationships;

  if (relationships) {
    const modelDef = schema.getModel(record.type);
    const recordIdentity = cloneRecordIdentity(record);

    Object.keys(relationships).forEach(relationship => {
      const relationshipDef = modelDef.relationships[relationship];
      const relationshipData =
        relationships[relationship] && relationships[relationship].data;
      const relatedRecords = recordArrayFromData(relationshipData);

      Array.prototype.push.apply(
        ops,
        removeRelatedRecordsOps(
          schema,
          recordIdentity,
          relationshipDef,
          relatedRecords
        )
      );
    });
  }

  return ops;
}

export function recordReplaced(
  schema: Schema,
  currentRecord: Record,
  record: Record
): RecordOperation[] {
  const ops: RecordOperation[] = [];

  if (record.relationships) {
    const modelDef = schema.getModel(record.type);
    const recordIdentity = cloneRecordIdentity(record);

    for (let relationship in record.relationships) {
      const relationshipDef = modelDef.relationships[relationship];
      const relationshipData =
        record && deepGet(record, ['relationships', relationship, 'data']);
      const currentRelationshipData =
        currentRecord &&
        deepGet(currentRecord, ['relationships', relationship, 'data']);

      if (relationshipDef.type === 'hasMany') {
        Array.prototype.push.apply(
          ops,
          relatedRecordsReplaced(
            schema,
            recordIdentity,
            relationship,
            currentRelationshipData,
            relationshipData
          )
        );
      } else {
        Array.prototype.push.apply(
          ops,
          relatedRecordReplaced(
            schema,
            recordIdentity,
            relationship,
            currentRelationshipData,
            relationshipData
          )
        );
      }
    }
  }

  return ops;
}

function addRelatedRecordsOps(
  schema: Schema,
  record: RecordIdentity,
  relationshipDef: RelationshipDefinition,
  relatedRecords: RecordIdentity[]
): RecordOperation[] {
  if (relatedRecords.length > 0 && relationshipDef.inverse) {
    return relatedRecords.map(relatedRecord =>
      addRelationshipOp(schema, relatedRecord, relationshipDef.inverse, record)
    );
  }
  return [];
}

export function removeRelatedRecordsOps(
  schema: Schema,
  record: RecordIdentity,
  relationshipDef: RelationshipDefinition,
  relatedRecords: RecordIdentity[]
): RecordOperation[] {
  if (relatedRecords.length > 0) {
    if (relationshipDef.dependent === 'remove') {
      return removeDependentRecords(relatedRecords);
    } else if (relationshipDef.inverse) {
      return relatedRecords.map(relatedRecord =>
        removeRelationshipOp(
          schema,
          relatedRecord,
          relationshipDef.inverse,
          record
        )
      );
    }
  }
  return [];
}

export function addRelationshipOp(
  schema: Schema,
  record: RecordIdentity,
  relationship: string,
  relatedRecord: RecordIdentity
): RecordOperation {
  const relationshipDef = schema.getModel(record.type).relationships[
    relationship
  ];
  const isHasMany = relationshipDef.type === 'hasMany';

  return {
    op: isHasMany ? 'addToRelatedRecords' : 'replaceRelatedRecord',
    record,
    relationship,
    relatedRecord
  } as RecordOperation;
}

export function removeRelationshipOp(
  schema: Schema,
  record: RecordIdentity,
  relationship: string,
  relatedRecord: RecordIdentity
): RecordOperation {
  const relationshipDef = schema.getModel(record.type).relationships[
    relationship
  ];
  const isHasMany = relationshipDef.type === 'hasMany';

  return {
    op: isHasMany ? 'removeFromRelatedRecords' : 'replaceRelatedRecord',
    record,
    relationship,
    relatedRecord: isHasMany ? relatedRecord : null
  } as RecordOperation;
}

export function recordArrayFromData(data: any): RecordIdentity[] {
  if (isArray(data)) {
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
    record =>
      ({
        op: 'removeRecord',
        record
      } as RecordOperation)
  );
}
