import { deepGet, isObject, isArray, Dict } from '@orbit/utils';
import {
  cloneRecordIdentity,
  RecordIdentity,
  RecordOperation
} from '@orbit/data';
import Cache from '../../cache';
import { OperationProcessor } from './operation-processor';

/**
 * An operation processor that ensures that a cache's data is consistent and
 * doesn't contain any dead references.
 *
 * This is achieved by maintaining a mapping of reverse relationships for each
 * record. When a record is removed, any references to it can also be identified
 * and removed.
 *
 * @export
 * @class CacheIntegrityProcessor
 * @extends {OperationProcessor}
 */
export default class CacheIntegrityProcessor extends OperationProcessor {
  after(operation: RecordOperation): RecordOperation[] {
    switch (operation.op) {
      case 'replaceRelatedRecord':
        this.cache.inverseRelationships.relatedRecordRemoved(operation.record, operation.relationship);
        return [];

      case 'replaceRelatedRecords':
        this.cache.inverseRelationships.relatedRecordsRemoved(operation.record, operation.relationship);
        return [];

      case 'removeFromRelatedRecords':
        this.cache.inverseRelationships.relatedRecordRemoved(operation.record, operation.relationship, operation.relatedRecord);
        return [];

      case 'removeRecord':
        let ops = this.clearInverseRelationshipOps(operation.record);
        this.cache.inverseRelationships.recordRemoved(operation.record);
        return ops;

      case 'replaceRecord':
        this.cache.inverseRelationships.recordRemoved(operation.record);
        return [];

      default:
        return [];
    }
  }

  immediate(operation): void {
    switch (operation.op) {
      case 'replaceRelatedRecord':
        this.cache.relationships.replaceRelatedRecord(operation.record, operation.relationship, operation.relatedRecord);
        return;

      case 'replaceRelatedRecords':
        this.cache.relationships.replaceRelatedRecords(operation.record, operation.relationship, operation.relatedRecords);
        return;

      case 'addToRelatedRecords':
        this.cache.relationships.addToRelatedRecords(operation.record, operation.relationship, operation.relatedRecord);
        return;

      case 'removeFromRelatedRecords':
        this.cache.relationships.removeFromRelatedRecords(operation.record, operation.relationship, operation.relatedRecord);
        return;

      case 'addRecord':
        this.cache.relationships.addRecord(operation.record);
        return;

      case 'replaceRecord':
        this.cache.relationships.replaceRecord(operation.record);
        return;

      case 'removeRecord':
        this.cache.relationships.clearRecord(operation.record);
        return;
    }
  }

  finally(operation): RecordOperation[] {
    switch (operation.op) {
      case 'replaceRelatedRecord':
        this.cache.inverseRelationships.relatedRecordAdded(operation.record, operation.relationship, operation.relatedRecord);
        return [];

      case 'replaceRelatedRecords':
        this.cache.inverseRelationships.relatedRecordsAdded(operation.record, operation.relationship, operation.relatedRecords);
        return [];

      case 'addToRelatedRecords':
        this.cache.inverseRelationships.relatedRecordAdded(operation.record, operation.relationship, operation.relatedRecord);
        return [];

      case 'addRecord':
        this.cache.inverseRelationships.recordAdded(operation.record);
        return [];

      case 'replaceRecord':
        this.cache.inverseRelationships.recordAdded(operation.record);
        return [];

      default:
        return [];
    }
  }

  private clearInverseRelationshipOps(record: RecordIdentity): RecordOperation[] {
    const ops: RecordOperation[] = [];
    const inverseRels = this.cache.inverseRelationships.all(record);

    if (inverseRels.length > 0) {
      const recordIdentity = cloneRecordIdentity(record);
      inverseRels.forEach(rel => {
        const relationshipDef = this.cache.schema.models[rel.record.type].relationships[rel.relationship];
        if (relationshipDef.type === 'hasMany') {
          ops.push({
            op: 'removeFromRelatedRecords',
            record: rel.record,
            relationship: rel.relationship,
            relatedRecord: recordIdentity
          });
        } else {
          ops.push({
            op: 'replaceRelatedRecord',
            record: rel.record,
            relationship: rel.relationship,
            relatedRecord: null
          });
        }
      });
    }

    return ops;
  }
}
