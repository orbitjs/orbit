import { isArray, isObject, isNone } from 'orbit/lib/objects';
import OperationProcessor from './operation-processor';
import { parseIdentifier } from './../../lib/identifiers';

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
  after(operation) {
    switch (operation.op) {
      case 'replaceHasOne':
        return this._relatedRecordRemoved(operation.record, operation.relationship);

      case 'replaceHasMany':
        return this._relatedRecordsRemoved(operation.record, operation.relationship);

      case 'removeFromHasMany':
        return this._relatedRecordRemoved(operation.record, operation.relationship, operation.relatedRecord);

      case 'removeRecord':
        return this._recordRemoved(operation.record);

      default:
        return [];
    }
  }

  finally(operation) {
    switch (operation.op) {
      case 'replaceHasOne':
        return this._relatedRecordAdded(operation.record, operation.relationship, operation.relatedRecord);

      case 'replaceHasMany':
        return this._relatedRecordsAdded(operation.record, operation.relationship, operation.relatedRecords);

      case 'addToHasMany':
        return this._relatedRecordAdded(operation.record, operation.relationship, operation.relatedRecord);

      case 'addRecord':
        return this._recordAdded(operation.record);

      default:
        return [];
    }
  }

  _relatedRecordAdded(record, relationship, relatedRecord) {
    const ops = [];
    const relationshipDef = this.cache.schema.relationshipDefinition(record.type, relationship);
    const inverseRelationship = relationshipDef.inverse;

    if (inverseRelationship && relatedRecord) {
      ops.push(this._addRelationshipOp(relatedRecord, inverseRelationship, record));
    }

    return ops;
  }

  _relatedRecordsAdded(record, relationship, relatedRecords) {
    const ops = [];
    const relationshipDef = this.cache.schema.relationshipDefinition(record.type, relationship);
    const inverseRelationship = relationshipDef.inverse;

    if (inverseRelationship && relatedRecords && relatedRecords.length > 0) {
      relatedRecords.forEach(relatedRecord => ops.push(this._addRelationshipOp(relatedRecord, inverseRelationship, record)));
    }

    return ops;
  }

  _relatedRecordRemoved(record, relationship, relatedRecord) {
    const ops = [];
    const relationshipDef = this.cache.schema.relationshipDefinition(record.type, relationship);
    const inverseRelationship = relationshipDef.inverse;

    if (inverseRelationship) {
      if (relatedRecord === undefined) {
        const relationshipData = this.cache.get([record.type, record.id, 'relationships', relationship, 'data']);
        if (relationshipData) {
          relatedRecord = parseIdentifier(relationshipData);
        }
      }

      if (relatedRecord) {
        ops.push(this._removeRelationshipOp(relatedRecord, inverseRelationship, record));
      }
    }

    return ops;
  }

  _relatedRecordsRemoved(record, relationship, relatedRecords) {
    const ops = [];
    const relationshipDef = this.cache.schema.relationshipDefinition(record.type, relationship);
    const inverseRelationship = relationshipDef.inverse;

    if (inverseRelationship) {
      if (relatedRecords === undefined) {
        const relationshipData = this.cache.get([record.type, record.id, 'relationships', relationship, 'data']);
        if (relationshipData) {
          relatedRecords = recordsFromData(relationshipData);
        }
      }

      if (relatedRecords) {
        relatedRecords.forEach(relatedRecord => ops.push(this._removeRelationshipOp(relatedRecord, inverseRelationship, record)));
      }
    }

    return ops;
  }

  _recordAdded(record) {
    const ops = [];
    const relationships = record.relationships;

    if (relationships) {
      Object.keys(relationships).forEach(relationship => {
        const relationshipData = relationships[relationship] && relationships[relationship].data;
        if (relationshipData) {
          const relatedRecords = recordsFromData(relationshipData);
          Array.prototype.push.apply(ops, this._relatedRecordsAdded(record, relationship, relatedRecords));
        }
      });
    }

    return ops;
  }

  _recordRemoved(record) {
    const ops = [];
    const relationships = this.cache.get([record.type, record.id, 'relationships']);

    if (relationships) {
      Object.keys(relationships).forEach((relationship) => {
        const relationshipData = relationships[relationship] && relationships[relationship].data;
        if (relationshipData) {
          const relationshipDef = this.cache.schema.relationshipDefinition(record.type, relationship);
          const relatedRecords = recordsFromData(relationshipData);

          if (relationshipDef.dependent === 'remove') {
            // TODO - needs test!
            Array.prototype.push.apply(ops, this._removeDependentRecords(relatedRecords));
          } else {
            Array.prototype.push.apply(ops, this._relatedRecordsRemoved(record, relationship, relatedRecords));
          }
        }
      });
    }

    return ops;
  }

  _addRelationshipOp(record, relationship, relatedRecord) {
    const relationshipDef = this.cache.schema.relationshipDefinition(record.type, relationship);
    const isHasMany = relationshipDef.type === 'hasMany';

    return {
      op: isHasMany ? 'addToHasMany' : 'replaceHasOne',
      record,
      relationship,
      relatedRecord
    };
  }

  _removeRelationshipOp(record, relationship, relatedRecord) {
    const relationshipDef = this.cache.schema.relationshipDefinition(record.type, relationship);
    const isHasMany = relationshipDef.type === 'hasMany';

    return {
      op: isHasMany ? 'removeFromHasMany' : 'replaceHasOne',
      record,
      relationship,
      relatedRecord: isHasMany ? relatedRecord : null
    };
  }

  _removeDependentRecords(relatedRecords) {
    const ops = [];

    relatedRecords.forEach(relatedRecord => {
      if (this.cache.get([relatedRecord.type, relatedRecord.id])) {
        ops.push({
          op: 'removeRecord',
          record: relatedRecord
        });
      }
    });

    return ops;
  }
}

function recordsFromData(data) {
  let ids;

  if (isArray(data)) {
    ids = data;
  } else if (isObject(data)) {
    ids = Object.keys(data);
  } else if (isNone(data)) {
    ids = [];
  } else {
    ids = [data];
  }

  return ids.map(id => {
    return parseIdentifier(id);
  });
}
