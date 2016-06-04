import { isArray, isObject, isNone } from 'orbit/lib/objects';
import OperationProcessor from './operation-processor';
import { toIdentifier, parseIdentifier } from './../../lib/identifiers';

/**
 An operation processor that ensures that a cache's data is consistent and
 doesn't contain any dead references.

 This is achieved by maintaining a mapping of reverse relationships for each record.
 When a record is removed, any references to it can also be identified and
 removed.

 @class CacheIntegrityProcessor
 @namespace OC
 @extends OperationProcessor
 @param {OC.Cache} [cache] Cache that is monitored.
 @constructor
 */
export default class CacheIntegrityProcessor extends OperationProcessor {
  constructor(cache) {
    super(cache);
    this._rev = {};
  }

  reset(data) {
    this._rev = {};

    if (data) {
      Object.keys(data).forEach((type) => {
        let typeData = data[type];
        Object.keys(typeData).forEach((id) => {
          this._recordAdded(typeData[id]);
        });
      });
    }
  }

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
    if (relatedRecord) {
      const relationshipDef = this.cache.schema.relationshipDefinition(record.type, relationship);
      if (relationshipDef.inverse) {
        this._addRevLink(record, relationship, relatedRecord);
      }
    }
    return [];
  }

  _relatedRecordsAdded(record, relationship, relatedRecords) {
    if (relatedRecords && relatedRecords.length > 0) {
      const relationshipDef = this.cache.schema.relationshipDefinition(record.type, relationship);
      if (relationshipDef.inverse) {
        relatedRecords.forEach(relatedRecord => this._addRevLink(record, relationship, relatedRecord));
      }
    }
    return [];
  }

  _relatedRecordRemoved(record, relationship, relatedRecord) {
    const relationshipDef = this.cache.schema.relationshipDefinition(record.type, relationship);

    if (relationshipDef.inverse) {
      if (relatedRecord === undefined) {
        const relationshipData = this.cache.get([record.type, record.id, 'relationships', relationship, 'data']);
        if (relationshipData) {
          relatedRecord = parseIdentifier(relationshipData);
        }
      }

      if (relatedRecord) {
        this._removeRevLink(record, relationship, relatedRecord);
      }
    }

    return [];
  }

  _relatedRecordsRemoved(record, relationship, relatedRecords) {
    const relationshipDef = this.cache.schema.relationshipDefinition(record.type, relationship);

    if (relationshipDef.inverse) {
      if (relatedRecords === undefined) {
        const relationshipData = this.cache.get([record.type, record.id, 'relationships', relationship, 'data']);
        if (relationshipData) {
          relatedRecords = recordsFromData(relationshipData);
        }
      }

      if (relatedRecords) {
        relatedRecords.forEach(relatedRecord => this._removeRevLink(record, relationship, relatedRecord));
      }
    }

    return [];
  }

  _recordAdded(record) {
    const relationships = record.relationships;

    if (relationships) {
      Object.keys(relationships).forEach(relationship => {
        const relationshipData = relationships[relationship] && relationships[relationship].data;
        if (relationshipData) {
          const relatedRecords = recordsFromData(relationshipData);
          relatedRecords.forEach(relatedRecord => this._addRevLink(record, relationship, relatedRecord));
        }
      }, this);
    }

    return [];
  }

  _recordRemoved(record) {
    const ops = [];
    const revLink = this._revLink(record);

    if (revLink) {
      Object.keys(revLink).forEach(_path => {
        const path = _path.split('/');

        if (path[2] === 'relationships' && path[4] === 'data') {
          const isHasMany = path.length === 6;

          if (isHasMany) {
            ops.push({
              op: 'removeFromHasMany',
              record: { type: path[0], id: path[1] },
              relationship: path[3],
              relatedRecord: parseIdentifier(path[5])
            });
          } else {
            ops.push({
              op: 'replaceHasOne',
              record: { type: path[0], id: path[1] },
              relationship: path[3],
              relatedRecord: null
            });
          }
        }
      });

      delete this._rev[record.type][record.id];
    }

    // when a whole record is removed, remove references corresponding to each relationship
    const relationships = this.cache.get([record.type, record.id, 'relationships']);
    if (relationships) {
      Object.keys(relationships).forEach(relationship => {
        const relationshipData = relationships[relationship] && relationships[relationship].data;
        if (relationshipData) {
          recordsFromData(relationshipData).forEach(relatedRecord => {
            this._removeRevLink(record, relationship, relatedRecord);
          });
        }
      });
    }

    return ops;
  }

  _revLink(record) {
    let revForType = this._rev[record.type];
    if (revForType === undefined) {
      revForType = this._rev[record.type] = {};
    }
    let rev = revForType[record.id];
    if (rev === undefined) {
      rev = revForType[record.id] = {};
    }
    return rev;
  }

  _addRevLink(record, relationship, relatedRecord) {
    if (relatedRecord) {
      const relationshipDef = this.cache.schema.relationshipDefinition(record.type, relationship);
      const relationshipPath = [record.type, record.id, 'relationships', relationship, 'data'];

      if (relationshipDef.type === 'hasMany') {
        relationshipPath.push(toIdentifier(relatedRecord.type, relatedRecord.id));
      }

      const revLink = this._revLink(relatedRecord);
      revLink[ relationshipPath.join('/') ] = true;
    }
  }

  _removeRevLink(record, relationship, relatedRecord) {
    if (relatedRecord) {
      const relationshipDef = this.cache.schema.relationshipDefinition(record.type, relationship);
      const relationshipPath = [record.type, record.id, 'relationships', relationship, 'data'];

      if (relationshipDef.type === 'hasMany') {
        relationshipPath.push(toIdentifier(relatedRecord.type, relatedRecord.id));
      }

      const revLink = this._revLink(relatedRecord);
      delete revLink[ relationshipPath.join('/') ];
    }
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
