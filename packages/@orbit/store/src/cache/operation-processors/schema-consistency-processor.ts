import {
  Dict,
  deepGet,
  isObject
} from '@orbit/utils';
import {
  cloneRecordIdentity,
  deserializeRecordIdentity,
  equalRecordIdentities,
  Record,
  RecordIdentity,
  RecordOperation,
  RelationshipDefinition,
  serializeRecordIdentity
} from '@orbit/data';
import { OperationProcessor } from './operation-processor';

/**
 An operation processor that ensures that a cache's data is consistent with
 its associated schema.

 This includes maintenance of inverse and dependent relationships.

 @class SchemaConsistencyProcessor
 @namespace OC
 @extends OperationProcessor
 @param {OC.Cache} [cache] Cache that is monitored.
 @constructor
 */
export default class SchemaConsistencyProcessor extends OperationProcessor {
  after(operation: RecordOperation): RecordOperation[] {
    switch (operation.op) {
      case 'addRecord':
        return this._recordAdded(operation.record);

      case 'addToRelatedRecords':
        return this._relatedRecordAdded(operation.record, operation.relationship, operation.relatedRecord);

      case 'replaceRelatedRecord':
        return this._relatedRecordReplaced(operation.record, operation.relationship, operation.relatedRecord);

      case 'replaceRelatedRecords':
        return this._relatedRecordsReplaced(operation.record, operation.relationship, operation.relatedRecords);

      case 'removeFromRelatedRecords':
        return this._relatedRecordRemoved(operation.record, operation.relationship, operation.relatedRecord);

      case 'removeRecord':
        return this._recordRemoved(operation.record);

      case 'replaceRecord':
        return this._recordReplaced(operation.record);

      default:
        return [];
    }
  }

  _relatedRecordAdded(record: RecordIdentity, relationship: string, relatedRecord: RecordIdentity): RecordOperation[] {
    const ops: RecordOperation[] = [];
    const relationshipDef = this.cache.schema.models[record.type].relationships[relationship];
    const inverseRelationship = relationshipDef.inverse;

    if (inverseRelationship && relatedRecord) {
      ops.push(this._addRelationshipOp(relatedRecord, inverseRelationship, record));
    }

    return ops;
  }

  _relatedRecordsAdded(record: RecordIdentity, relationship: string, relatedRecords: RecordIdentity[]): RecordOperation[] {
    const ops: RecordOperation[] = [];
    const relationshipDef = this.cache.schema.models[record.type].relationships[relationship];
    const inverseRelationship = relationshipDef.inverse;

    if (inverseRelationship && relatedRecords && relatedRecords.length > 0) {
      relatedRecords.forEach(relatedRecord => ops.push(this._addRelationshipOp(relatedRecord, inverseRelationship, record)));
    }

    return ops;
  }

  _relatedRecordRemoved(record: RecordIdentity, relationship: string, relatedRecord: RecordIdentity): RecordOperation[] {
    const ops: RecordOperation[] = [];
    const relationshipDef = this.cache.schema.models[record.type].relationships[relationship];
    const inverseRelationship = relationshipDef.inverse;

    if (inverseRelationship) {
      if (relatedRecord === undefined) {
        const currentRecord = this.cache.records(record.type).get(record.id);
        const relationshipData = currentRecord && deepGet(currentRecord, ['relationships', relationship, 'data']);
        if (relationshipData) {
          relatedRecord = deserializeRecordIdentity(relationshipData);
        }
      }

      if (relatedRecord) {
        ops.push(this._removeRelationshipOp(relatedRecord, inverseRelationship, record));
      }
    }

    return ops;
  }

  _relatedRecordReplaced(record: RecordIdentity, relationship: string, relatedRecord: RecordIdentity): RecordOperation[] {
    const ops: RecordOperation[] = [];
    const relationshipDef = this.cache.schema.models[record.type].relationships[relationship];
    const inverseRelationship = relationshipDef.inverse;

    if (inverseRelationship) {
      const currentRecord = this.cache.records(record.type).get(record.id);
      const prevRelationshipData = currentRecord && deepGet(currentRecord, ['relationships', relationship, 'data']);
      let prevRelatedRecord;

      if (prevRelationshipData) {
        prevRelatedRecord = deserializeRecordIdentity(prevRelationshipData);
      }

      if (!equalRecordIdentities(prevRelatedRecord, relatedRecord)) {
        if (prevRelatedRecord) {
          ops.push(this._removeRelationshipOp(prevRelatedRecord, inverseRelationship, record));
        }

        if (relatedRecord) {
          ops.push(this._addRelationshipOp(relatedRecord, inverseRelationship, record));
        }
      }
    }

    return ops;
  }


  _relatedRecordsRemoved(record: RecordIdentity, relationship: string, relatedRecords: RecordIdentity[]): RecordOperation[] {
    const ops: RecordOperation[] = [];
    const relationshipDef = this.cache.schema.models[record.type].relationships[relationship];
    const inverseRelationship = relationshipDef.inverse;

    if (inverseRelationship) {
      if (relatedRecords === undefined) {
        const currentRecord = this.cache.records(record.type).get(record.id);
        const relationshipData = currentRecord && deepGet(currentRecord, ['relationships', relationship, 'data']);
        if (relationshipData) {
          relatedRecords = recordArrayFromData(relationshipData);
        }
      }

      if (relatedRecords) {
        relatedRecords.forEach(relatedRecord => ops.push(this._removeRelationshipOp(relatedRecord, inverseRelationship, record)));
      }
    }

    return ops;
  }

  _relatedRecordsReplaced(record: RecordIdentity, relationship: string, relatedRecords: RecordIdentity[]): RecordOperation[] {
    const ops: RecordOperation[] = [];
    const relationshipDef = this.cache.schema.models[record.type].relationships[relationship];
    const currentRecord = this.cache.records(record.type).get(record.id);
    const prevRelationshipData = currentRecord && deepGet(currentRecord, ['relationships', relationship, 'data']);
    const prevRelatedRecordMap = recordMapFromData(prevRelationshipData);
    const relatedRecordMap = recordMapFromArray(relatedRecords);

    const removedRecords = Object.keys(prevRelatedRecordMap)
      .filter(id => !relatedRecordMap[id])
      .map(id => deserializeRecordIdentity(id));

    Array.prototype.push.apply(ops, this._removeRelatedRecordsOps(record, relationshipDef, removedRecords));

    const addedRecords = Object.keys(relatedRecordMap)
      .filter(id => !prevRelatedRecordMap[id])
      .map(id => deserializeRecordIdentity(id));

    Array.prototype.push.apply(ops, this._addRelatedRecordsOps(record, relationshipDef, addedRecords));

    return ops;
  }

  _recordAdded(record: Record): RecordOperation[] {
    const ops: RecordOperation[] = [];
    const relationships = record.relationships;

    if (relationships) {
      const modelDef = this.cache.schema.models[record.type];
      const recordIdentity = cloneRecordIdentity(record);

      Object.keys(relationships).forEach(relationship => {
        const relationshipDef = modelDef.relationships[relationship];

        const relationshipData = relationships[relationship] &&
                                 relationships[relationship].data;

        const relatedRecords = recordArrayFromData(relationshipData);

        Array.prototype.push.apply(ops, this._addRelatedRecordsOps(recordIdentity, relationshipDef, relatedRecords));
      });
    }

    return ops;
  }

  _recordRemoved(record: RecordIdentity): RecordOperation[] {
    const ops: RecordOperation[] = [];
    const currentRecord = this.cache.records(record.type).get(record.id);
    const relationships = currentRecord && currentRecord.relationships;

    if (relationships) {
      const modelDef = this.cache.schema.models[record.type];
      const recordIdentity = cloneRecordIdentity(record);

      Object.keys(relationships).forEach(relationship => {
        const relationshipDef = modelDef.relationships[relationship];
        const relationshipData = relationships[relationship] &&
                                 relationships[relationship].data;
        const relatedRecords = recordArrayFromData(relationshipData);

        Array.prototype.push.apply(ops, this._removeRelatedRecordsOps(recordIdentity, relationshipDef, relatedRecords));
      });
    }

    return ops;
  }

  _recordReplaced(record: Record): RecordOperation[] {
    const ops: RecordOperation[] = [];

    if (record.relationships) {
      const modelDef = this.cache.schema.models[record.type];
      const recordIdentity = cloneRecordIdentity(record);

      for (let relationship in record.relationships) {
        const relationshipDef = modelDef.relationships[relationship];
        const currentRecord = this.cache.records(record.type).get(record.id);
        const relationshipData = record && deepGet(record, ['relationships', relationship, 'data']);
        const prevRelationshipData = currentRecord && deepGet(currentRecord, ['relationships', relationship, 'data']);

        const relatedRecordMap = recordMapFromData(relationshipData);
        const prevRelatedRecordMap = recordMapFromData(prevRelationshipData);

        if (prevRelationshipData !== undefined) {
          const removedRecords = Object.keys(prevRelatedRecordMap)
            .filter(id => !relatedRecordMap[id])
            .map(id => deserializeRecordIdentity(id));

          Array.prototype.push.apply(ops, this._removeRelatedRecordsOps(recordIdentity, relationshipDef, removedRecords));
        }

        const addedRecords = Object.keys(relatedRecordMap)
          .filter(id => !prevRelatedRecordMap[id])
          .map(id => deserializeRecordIdentity(id));

        Array.prototype.push.apply(ops, this._addRelatedRecordsOps(recordIdentity, relationshipDef, addedRecords));
      }
    }

    return ops;
  }

  _addRelatedRecordsOps(record: RecordIdentity, relationshipDef: RelationshipDefinition, relatedRecords: RecordIdentity[]): RecordOperation[] {
    if (relatedRecords.length > 0 && relationshipDef.inverse) {
      return relatedRecords.map(relatedRecord => this._addRelationshipOp(relatedRecord, relationshipDef.inverse, record));
    }
    return [];
  }

  _removeRelatedRecordsOps(record: RecordIdentity, relationshipDef: RelationshipDefinition, relatedRecords: RecordIdentity[]): RecordOperation[] {
    if (relatedRecords.length > 0) {
      if (relationshipDef.dependent === 'remove') {
        return this._removeDependentRecords(relatedRecords);
      } else if (relationshipDef.inverse) {
        return relatedRecords.map(relatedRecord => this._removeRelationshipOp(relatedRecord, relationshipDef.inverse, record));
      }
    }
    return [];
  }

  _addRelationshipOp(record: RecordIdentity, relationship: string, relatedRecord: RecordIdentity): RecordOperation {
    const relationshipDef = this.cache.schema.models[record.type].relationships[relationship];
    const isHasMany = relationshipDef.type === 'hasMany';

    return <RecordOperation>{
      op: isHasMany ? 'addToRelatedRecords' : 'replaceRelatedRecord',
      record,
      relationship,
      relatedRecord
    };
  }

  _removeRelationshipOp(record: RecordIdentity, relationship: string, relatedRecord: RecordIdentity): RecordOperation {
    const relationshipDef = this.cache.schema.models[record.type].relationships[relationship];
    const isHasMany = relationshipDef.type === 'hasMany';

    return <RecordOperation>{
      op: isHasMany ? 'removeFromRelatedRecords' : 'replaceRelatedRecord',
      record,
      relationship,
      relatedRecord: isHasMany ? relatedRecord : null
    };
  }

  _removeDependentRecords(relatedRecords: RecordIdentity[]): RecordOperation[] {
    const ops: RecordOperation[] = [];

    relatedRecords.forEach(relatedRecord => {
      if (this.cache.records(relatedRecord.type).get(relatedRecord.id)) {
        ops.push(<RecordOperation>{
          op: 'removeRecord',
          record: relatedRecord
        });
      }
    });

    return ops;
  }
}

function recordArrayFromData(data: any): RecordIdentity[] {
  let ids;

  if (isObject(data)) {
    ids = Object.keys(data);
  } else if (typeof data === 'string') {
    ids = [data];
  } else {
    ids = [];
  }

  return ids.map(id => deserializeRecordIdentity(id));
}

function recordMapFromData(data: any): Dict<boolean>  {
  if (isObject(data)) {
    return <Dict<boolean>>data;
  } else if (typeof data === 'string') {
    return {[data]: true};
  } else {
    return {};
  }
}

function recordMapFromArray(records): Dict<boolean> {
  let map = {};
  records.forEach(record => {
    map[serializeRecordIdentity(record)] = true;
  });
  return map;
}
