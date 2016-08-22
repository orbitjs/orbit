import { isObject } from '../../lib/objects';
import { identity, toIdentifier, parseIdentifier, eqIdentity } from '../../lib/identifiers';
import OperationProcessor from './operation-processor';

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
      case 'addRecord':
        return this._recordAdded(operation.record);

      case 'addToHasMany':
        return this._relatedRecordAdded(operation.record, operation.relationship, operation.relatedRecord);

      case 'replaceHasOne':
        return this._relatedRecordReplaced(operation.record, operation.relationship, operation.relatedRecord);

      case 'replaceHasMany':
        return this._relatedRecordsReplaced(operation.record, operation.relationship, operation.relatedRecords);

      case 'removeFromHasMany':
        return this._relatedRecordRemoved(operation.record, operation.relationship, operation.relatedRecord);

      case 'removeRecord':
        return this._recordRemoved(operation.record);

      case 'replaceRecord':
        return this._recordReplaced(operation.record);

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

  _relatedRecordReplaced(record, relationship, relatedRecord) {
    const ops = [];
    const relationshipDef = this.cache.schema.relationshipDefinition(record.type, relationship);
    const inverseRelationship = relationshipDef.inverse;

    if (inverseRelationship) {
      const prevRelationshipData = this.cache.get([record.type, record.id, 'relationships', relationship, 'data']);
      let prevRelatedRecord;

      if (prevRelationshipData) {
        prevRelatedRecord = parseIdentifier(prevRelationshipData);
      }

      if (!eqIdentity(prevRelatedRecord, relatedRecord)) {
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


  _relatedRecordsRemoved(record, relationship, relatedRecords) {
    const ops = [];
    const relationshipDef = this.cache.schema.relationshipDefinition(record.type, relationship);
    const inverseRelationship = relationshipDef.inverse;

    if (inverseRelationship) {
      if (relatedRecords === undefined) {
        const relationshipData = this.cache.get([record.type, record.id, 'relationships', relationship, 'data']);
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

  _relatedRecordsReplaced(record, relationship, relatedRecords) {
    const ops = [];
    const relationshipDef = this.cache.schema.relationshipDefinition(record.type, relationship);
    const prevRelationshipData = this.cache.get([record.type, record.id, 'relationships', relationship, 'data']);
    const prevRelatedRecordMap = recordMapFromData(prevRelationshipData);
    const relatedRecordMap = recordMapFromArray(relatedRecords);

    const removedRecords = Object.keys(prevRelatedRecordMap)
      .filter(id => !relatedRecordMap[id])
      .map(id => parseIdentifier(id));

    Array.prototype.push.apply(ops, this._removeRelatedRecordsOps(record, relationshipDef, removedRecords));

    const addedRecords = Object.keys(relatedRecordMap)
      .filter(id => !prevRelatedRecordMap[id])
      .map(id => parseIdentifier(id));

    Array.prototype.push.apply(ops, this._addRelatedRecordsOps(record, relationshipDef, addedRecords));

    return ops;
  }

  _recordAdded(record) {
    const ops = [];
    const relationships = record.relationships;

    if (relationships) {
      const modelDef = this.cache.schema.modelDefinition(record.type);
      const recordIdentity = identity(record);

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

  _recordRemoved(record) {
    const ops = [];
    const relationships = this.cache.get([record.type, record.id, 'relationships']);

    if (relationships) {
      const modelDef = this.cache.schema.modelDefinition(record.type);
      const recordIdentity = identity(record);

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

  _recordReplaced(record) {
    const ops = [];
    const modelDef = this.cache.schema.modelDefinition(record.type);
    const recordIdentity = identity(record);

    for (let relationship in modelDef.relationships) {
      const relationshipDef = modelDef.relationships[relationship];
      const prevRelationshipData = this.cache.get([record.type, record.id, 'relationships', relationship, 'data']);
      const prevRelatedRecordMap = recordMapFromData(prevRelationshipData);
      const relationshipData = record &&
                               record.relationships &&
                               record.relationships[relationship] &&
                               record.relationships[relationship].data;
      const relatedRecordMap = recordMapFromData(relationshipData);

      const removedRecords = Object.keys(prevRelatedRecordMap)
        .filter(id => !relatedRecordMap[id])
        .map(id => parseIdentifier(id));

      Array.prototype.push.apply(ops, this._removeRelatedRecordsOps(recordIdentity, relationshipDef, removedRecords));

      const addedRecords = Object.keys(relatedRecordMap)
        .filter(id => !prevRelatedRecordMap[id])
        .map(id => parseIdentifier(id));

      Array.prototype.push.apply(ops, this._addRelatedRecordsOps(recordIdentity, relationshipDef, addedRecords));
    }

    return ops;
  }

  _addRelatedRecordsOps(record, relationshipDef, relatedRecords) {
    if (relatedRecords.length > 0 && relationshipDef.inverse) {
      return relatedRecords.map(relatedRecord => this._addRelationshipOp(relatedRecord, relationshipDef.inverse, record));
    }
    return [];
  }

  _removeRelatedRecordsOps(record, relationshipDef, relatedRecords) {
    if (relatedRecords.length > 0) {
      if (relationshipDef.dependent === 'remove') {
        return this._removeDependentRecords(relatedRecords);
      } else if (relationshipDef.inverse) {
        return relatedRecords.map(relatedRecord => this._removeRelationshipOp(relatedRecord, relationshipDef.inverse, record));
      }
    }
    return [];
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

function recordArrayFromData(data) {
  let ids;

  if (isObject(data)) {
    ids = Object.keys(data);
  } else if (typeof data === 'string') {
    ids = [data];
  } else {
    ids = [];
  }

  return ids.map(id => parseIdentifier(id));
}

function recordMapFromData(data) {
  if (isObject(data)) {
    return data;
  } else if (typeof data === 'string') {
    return {[data]: true};
  } else {
    return {};
  }
}

function recordMapFromArray(records) {
  let map = {};
  records.forEach(record => {
    map[toIdentifier(record)] = true;
  });
  return map;
}
