import {
  Dict,
  deepGet,
  isArray
} from '@orbit/utils';
import {
  cloneRecordIdentity,
  equalRecordIdentities,
  Record,
  RecordIdentity,
  RecordOperation,
  RelationshipDefinition
} from '@orbit/data';
import { OperationProcessor } from './operation-processor';
import RecordIdentityMap from '../record-identity-map';

/**
 * An operation processor that ensures that a cache's data is consistent with
 * its associated schema.
 *
 * This includes maintenance of inverse and dependent relationships.
 *
 * @export
 * @class SchemaConsistencyProcessor
 * @extends {OperationProcessor}
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
      relatedRecords.forEach(relatedRecord => {
        ops.push(this._addRelationshipOp(relatedRecord, inverseRelationship, record))
      });
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
        relatedRecord = currentRecord && deepGet(currentRecord, ['relationships', relationship, 'data']);
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
      let currentRelatedRecord = this.cache.relationships.relatedRecord(record, relationship);

      if (!equalRecordIdentities(relatedRecord, currentRelatedRecord)) {
        if (currentRelatedRecord) {
          ops.push(this._removeRelationshipOp(currentRelatedRecord, inverseRelationship, record));
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
        let relatedRecordsMap = this.cache.relationships.relatedRecordsMap(record, relationship);
        relatedRecords = relatedRecordsMap && relatedRecordsMap.all();
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
    const currentRelatedRecordsMap = this.cache.relationships.relatedRecordsMap(record, relationship);

    let addedRecords;

    if (currentRelatedRecordsMap) {
      const relatedRecordsMap = new RecordIdentityMap();
      relatedRecords.forEach(r => relatedRecordsMap.add(r));

      let removedRecords = currentRelatedRecordsMap.exclusiveOf(relatedRecordsMap);
      Array.prototype.push.apply(ops, this._removeRelatedRecordsOps(record, relationshipDef, removedRecords));

      addedRecords = relatedRecordsMap.exclusiveOf(currentRelatedRecordsMap);
    } else {
      addedRecords = relatedRecords;
    }

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
        const relationshipData = record && deepGet(record, ['relationships', relationship, 'data']);

        if (relationshipDef.type === 'hasMany') {
          Array.prototype.push.apply(ops, this._relatedRecordsReplaced(recordIdentity, relationship, relationshipData));
        } else {
          Array.prototype.push.apply(ops, this._relatedRecordReplaced(recordIdentity, relationship, relationshipData));
        }
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
  if (isArray(data)) {
    return data;
  } else if (data) {
    return [data];
  } else {
    return [];
  }
}
