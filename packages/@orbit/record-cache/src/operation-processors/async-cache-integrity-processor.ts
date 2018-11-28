import {
  Record,
  RecordIdentity,
  RecordOperation
} from '@orbit/data';
import { AsyncOperationProcessor } from '../async-operation-processor';
import {
  getInverseRelationship,
  getInverseRelationships,
  getAllInverseRelationships,
  getInverseRelationshipRemovalOps
} from './utils/cache-integrity-utils';

/**
 * An operation processor that ensures that a cache's data is consistent and
 * doesn't contain any dead references.
 *
 * This is achieved by maintaining a mapping of reverse relationships for each
 * record. When a record is removed, any references to it can also be identified
 * and removed.
 */
export default class AsyncCacheIntegrityProcessor extends AsyncOperationProcessor {
  async after(operation: RecordOperation): Promise<RecordOperation[]> {
    switch (operation.op) {
      case 'replaceRelatedRecord':
        await this.removeInverseRelationship(
          operation.record,
          operation.relationship,
          await this.accessor.getRelatedRecordAsync(operation.record, operation.relationship)
        );
        return [];

      case 'replaceRelatedRecords':
        await this.removeInverseRelationships(
          operation.record,
          operation.relationship,
          await this.accessor.getRelatedRecordsAsync(operation.record, operation.relationship)
        );
        return [];

      case 'removeFromRelatedRecords':
        await this.removeInverseRelationship(
          operation.record,
          operation.relationship,
          operation.relatedRecord
        );
        return [];

      case 'removeRecord':
        let ops = await this.clearInverseRelationshipOps(operation.record);
        await this.removeAllInverseRelationships(operation.record);
        return ops;

      case 'replaceRecord':
        await this.removeAllInverseRelationships(operation.record);
        return [];

      default:
        return [];
    }
  }

  async finally(operation): Promise<RecordOperation[]> {
    switch (operation.op) {
      case 'replaceRelatedRecord':
        await this.addInverseRelationship(operation.record, operation.relationship, operation.relatedRecord);
        return [];

      case 'replaceRelatedRecords':
        await this.addInverseRelationships(operation.record, operation.relationship, operation.relatedRecords);
        return [];

      case 'addToRelatedRecords':
        await this.addInverseRelationship(operation.record, operation.relationship, operation.relatedRecord);
        return [];

      case 'addRecord':
        await this.addAllInverseRelationships(operation.record);
        return [];

      case 'replaceRecord':
        await this.addAllInverseRelationships(operation.record);
        return [];

      default:
        return [];
    }
  }

  protected async addInverseRelationship(record: RecordIdentity, relationship: string, relatedRecord: RecordIdentity): Promise<void> {
    let inverseRelationship = getInverseRelationship(this.accessor.schema, record, relationship, relatedRecord);
    if (inverseRelationship) {
      await this.accessor.addInverseRelationshipsAsync([inverseRelationship]);
    }
  }

  protected async addInverseRelationships(record: RecordIdentity, relationship: string, relatedRecords: RecordIdentity[]): Promise<void> {
    let inverseRelationships = getInverseRelationships(this.accessor.schema, record, relationship, relatedRecords);
    if (inverseRelationships) {
      await this.accessor.addInverseRelationshipsAsync(inverseRelationships);
    }
  }

  protected async addAllInverseRelationships(record: Record): Promise<void> {
    let inverseRelationships = getAllInverseRelationships(record);
    if (inverseRelationships) {
      await this.accessor.addInverseRelationshipsAsync(inverseRelationships);
    }
  }

  protected async removeInverseRelationship(record: RecordIdentity, relationship: string, relatedRecord: RecordIdentity): Promise<void> {
    let inverseRelationship = getInverseRelationship(this.accessor.schema, record, relationship, relatedRecord);
    if (inverseRelationship) {
      await this.accessor.removeInverseRelationshipsAsync([inverseRelationship]);
    }
  }

  protected async removeInverseRelationships(record: RecordIdentity, relationship: string, relatedRecords: RecordIdentity[]): Promise<void> {
    let inverseRelationships = getInverseRelationships(this.accessor.schema, record, relationship, relatedRecords);
    if (inverseRelationships) {
      await this.accessor.removeInverseRelationshipsAsync(inverseRelationships);
    }
  }

  protected async removeAllInverseRelationships(record: RecordIdentity): Promise<void> {
    const recordInCache = await this.accessor.getRecordAsync(record);
    const inverseRelationships = getAllInverseRelationships(recordInCache);
    if (inverseRelationships) {
      await this.accessor.removeInverseRelationshipsAsync(inverseRelationships);
    }
  }

  protected async clearInverseRelationshipOps(record: RecordIdentity): Promise<RecordOperation[]> {
    return getInverseRelationshipRemovalOps(
      this.accessor.schema,
      await this.accessor.getInverseRelationshipsAsync(record)
    );
  }
}
