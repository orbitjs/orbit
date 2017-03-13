import { deepGet, isObject, Dict } from '@orbit/utils';
import { 
  serializeRecordIdentity, 
  deserializeRecordIdentity,
  Record,
  RecordIdentity,
  RecordOperation
} from '@orbit/core';
import { OperationProcessor } from './operation-processor';

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
  private _rev: Dict<Dict<object>>;

  constructor(cache) {
    super(cache);

    this._rev = {};
  }

  reset(): void {
    this._rev = {};

    Object.keys(this.cache.records).forEach(type => {
      this.cache.records(type).values.forEach(record => this._recordAdded(<RecordIdentity>record));
    });
  }

  after(operation: RecordOperation): RecordOperation[] {
    switch (operation.op) {
      case 'replaceHasOne':
        return this._relatedRecordRemoved(operation.record, operation.relationship);

      case 'replaceHasMany':
        return this._relatedRecordsRemoved(operation.record, operation.relationship);

      case 'removeFromHasMany':
        return this._relatedRecordRemoved(operation.record, operation.relationship, operation.relatedRecord);

      case 'removeRecord':
        return this._recordRemoved(operation.record);

      case 'replaceRecord':
        return this._recordRelationshipsRemoved(operation.record);

      default:
        return [];
    }
  }

  finally(operation): RecordOperation[] {
    switch (operation.op) {
      case 'replaceHasOne':
        return this._relatedRecordAdded(operation.record, operation.relationship, operation.relatedRecord);

      case 'replaceHasMany':
        return this._relatedRecordsAdded(operation.record, operation.relationship, operation.relatedRecords);

      case 'addToHasMany':
        return this._relatedRecordAdded(operation.record, operation.relationship, operation.relatedRecord);

      case 'addRecord':
        return this._recordAdded(operation.record);

      case 'replaceRecord':
        return this._recordRelationshipsAdded(operation.record);

      default:
        return [];
    }
  }

  private _relatedRecordAdded(record: RecordIdentity, relationship: string, relatedRecord: RecordIdentity): RecordOperation[] {
    if (relatedRecord) {
      const relationshipDef = this.cache.schema.relationshipDefinition(record.type, relationship);
      if (relationshipDef.inverse) {
        this._addRevLink(record, relationship, relatedRecord);
      }
    }
    return [];
  }

  private _relatedRecordsAdded(record: RecordIdentity, relationship: string, relatedRecords: RecordIdentity[]): RecordOperation[] {
    if (relatedRecords && relatedRecords.length > 0) {
      const relationshipDef = this.cache.schema.relationshipDefinition(record.type, relationship);
      if (relationshipDef.inverse) {
        relatedRecords.forEach(relatedRecord => this._addRevLink(record, relationship, relatedRecord));
      }
    }
    return [];
  }

  private _relatedRecordRemoved(record: RecordIdentity, relationship: string, relatedRecord?: RecordIdentity): RecordOperation[] {
    const relationshipDef = this.cache.schema.relationshipDefinition(record.type, relationship);

    if (relationshipDef.inverse) {
      if (relatedRecord === undefined) {
        const currentRecord = this.cache.records(record.type).get(record.id);
        const relationshipData = currentRecord && deepGet(currentRecord, ['relationships', relationship, 'data']);
        if (relationshipData) {
          relatedRecord = deserializeRecordIdentity(relationshipData);
        }
      }

      if (relatedRecord) {
        this._removeRevLink(record, relationship, relatedRecord);
      }
    }

    return [];
  }

  private _relatedRecordsRemoved(record: RecordIdentity, relationship: string, relatedRecords?: RecordIdentity[]): RecordOperation[] {
    const relationshipDef = this.cache.schema.relationshipDefinition(record.type, relationship);

    if (relationshipDef.inverse) {
      if (relatedRecords === undefined) {
        const currentRecord = this.cache.records(record.type).get(record.id);
        const relationshipData = currentRecord && deepGet(currentRecord, ['relationships', relationship, 'data']);
        if (relationshipData) {
          relatedRecords = recordArrayFromData(relationshipData);
        }
      }

      if (relatedRecords) {
        relatedRecords.forEach(relatedRecord => this._removeRevLink(record, relationship, relatedRecord));
      }
    }

    return [];
  }

  private _recordAdded(record: RecordIdentity): RecordOperation[] {
    this._addAllRevLinks(record);

    return [];
  }

  private _recordRemoved(record: RecordIdentity): RecordOperation[] {
    const ops: RecordOperation[] = [];
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
              relatedRecord: deserializeRecordIdentity(path[5])
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

    this._removeAllRevLinks(record);

    return ops;
  }

  private _recordRelationshipsAdded(record: RecordIdentity): RecordOperation[] {
    this._addAllRevLinks(record);

    return [];
  }

  private _recordRelationshipsRemoved(record: RecordIdentity): RecordOperation[] {
    this._removeAllRevLinks(record);

    return [];
  }

  private _revLink(record: RecordIdentity): object {
    let revForType: Dict<object> = this._rev[record.type];
    if (revForType === undefined) {
      revForType = this._rev[record.type] = {};
    }
    let rev: object = revForType[record.id];
    if (rev === undefined) {
      rev = revForType[record.id] = {};
    }
    return rev;
  }

  private _addAllRevLinks(record: Record): void {
    const relationships = record.relationships;
    if (relationships) {
      Object.keys(relationships).forEach(relationship => {
        const relationshipData = relationships[relationship] && relationships[relationship].data;
        if (relationshipData) {
          const relatedRecords = recordArrayFromData(relationshipData);
          relatedRecords.forEach(relatedRecord => {
            this._addRevLink(record, relationship, relatedRecord);
          });
        }
      });
    }
  }

  private _removeAllRevLinks(record: RecordIdentity): void {
    const recordInCache: Record = this.cache.records(record.type).get(record.id);
    const relationships = recordInCache && recordInCache.relationships;
    if (relationships) {
      Object.keys(relationships).forEach(relationship => {
        const relationshipData = relationships[relationship] && relationships[relationship].data;
        if (relationshipData) {
          const relatedRecords = recordArrayFromData(relationshipData);
          relatedRecords.forEach(relatedRecord => {
            this._removeRevLink(record, relationship, relatedRecord);
          });
        }
      });
    }
  }

  _addRevLink(record: RecordIdentity, relationship: string, relatedRecord: RecordIdentity): void {
    if (relatedRecord) {
      const relationshipDef = this.cache.schema.relationshipDefinition(record.type, relationship);
      const relationshipPath = [record.type, record.id, 'relationships', relationship, 'data'];

      if (relationshipDef.type === 'hasMany') {
        relationshipPath.push(serializeRecordIdentity(relatedRecord));
      }

      const revLink = this._revLink(relatedRecord);
      revLink[ relationshipPath.join('/') ] = true;
    }
  }

  _removeRevLink(record: RecordIdentity, relationship: string, relatedRecord: RecordIdentity): void {
    if (relatedRecord) {
      const relationshipDef = this.cache.schema.relationshipDefinition(record.type, relationship);
      const relationshipPath = [record.type, record.id, 'relationships', relationship, 'data'];

      if (relationshipDef.type === 'hasMany') {
        relationshipPath.push(serializeRecordIdentity(relatedRecord));
      }

      const revLink: object = this._revLink(relatedRecord);
      delete revLink[ relationshipPath.join('/') ];
    }
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
