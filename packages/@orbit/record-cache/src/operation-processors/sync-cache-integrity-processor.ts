import {
  InitializedRecord,
  RecordIdentity,
  RecordOperation
} from '@orbit/records';
import { SyncOperationProcessor } from '../sync-operation-processor';
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
export class SyncCacheIntegrityProcessor extends SyncOperationProcessor {
  after(operation: RecordOperation): RecordOperation[] {
    switch (operation.op) {
      case 'replaceRelatedRecord':
        this.removeInverseRelationship(
          operation.record,
          operation.relationship,
          this.accessor.getRelatedRecordSync(
            operation.record,
            operation.relationship
          )
        );
        return [];

      case 'replaceRelatedRecords':
        this.removeInverseRelationships(
          operation.record,
          operation.relationship,
          this.accessor.getRelatedRecordsSync(
            operation.record,
            operation.relationship
          )
        );
        return [];

      case 'removeFromRelatedRecords':
        this.removeInverseRelationship(
          operation.record,
          operation.relationship,
          operation.relatedRecord
        );
        return [];

      case 'removeRecord':
        this.removeAllInverseRelationships(operation.record);
        return [];

      case 'updateRecord':
        this.removeAllInverseRelationships(operation.record);
        return [];

      default:
        return [];
    }
  }

  finally(operation: RecordOperation): RecordOperation[] {
    switch (operation.op) {
      case 'replaceRelatedRecord':
        this.addInverseRelationship(
          operation.record,
          operation.relationship,
          operation.relatedRecord
        );
        return [];

      case 'replaceRelatedRecords':
        this.addInverseRelationships(
          operation.record,
          operation.relationship,
          operation.relatedRecords
        );
        return [];

      case 'addToRelatedRecords':
        this.addInverseRelationship(
          operation.record,
          operation.relationship,
          operation.relatedRecord
        );
        return [];

      case 'addRecord':
        this.addAllInverseRelationships(operation.record);
        return [];

      case 'updateRecord':
        this.addAllInverseRelationships(operation.record);
        return [];

      case 'removeRecord':
        return this.clearInverseRelationshipOps(operation.record);

      default:
        return [];
    }
  }

  protected addInverseRelationship(
    record: RecordIdentity,
    relationship: string,
    relatedRecord: RecordIdentity | null
  ): void {
    let inverseRelationship = getInverseRelationship(
      this.accessor.schema,
      record,
      relationship,
      relatedRecord
    );
    if (inverseRelationship) {
      this.accessor.addInverseRelationshipsSync([inverseRelationship]);
    }
  }

  protected addInverseRelationships(
    record: RecordIdentity,
    relationship: string,
    relatedRecords: RecordIdentity[]
  ): void {
    let inverseRelationships = getInverseRelationships(
      this.accessor.schema,
      record,
      relationship,
      relatedRecords
    );
    if (inverseRelationships) {
      this.accessor.addInverseRelationshipsSync(inverseRelationships);
    }
  }

  protected addAllInverseRelationships(record: InitializedRecord): void {
    let inverseRelationships = getAllInverseRelationships(
      this.accessor.schema,
      record
    );
    if (inverseRelationships.length > 0) {
      this.accessor.addInverseRelationshipsSync(inverseRelationships);
    }
  }

  protected removeInverseRelationship(
    record: RecordIdentity,
    relationship: string,
    relatedRecord?: RecordIdentity | null
  ): void {
    let inverseRelationship = getInverseRelationship(
      this.accessor.schema,
      record,
      relationship,
      relatedRecord
    );
    if (inverseRelationship) {
      this.accessor.removeInverseRelationshipsSync([inverseRelationship]);
    }
  }

  protected removeInverseRelationships(
    record: RecordIdentity,
    relationship: string,
    relatedRecords?: RecordIdentity[]
  ): void {
    let inverseRelationships = getInverseRelationships(
      this.accessor.schema,
      record,
      relationship,
      relatedRecords
    );
    if (inverseRelationships.length > 0) {
      this.accessor.removeInverseRelationshipsSync(inverseRelationships);
    }
  }

  protected removeAllInverseRelationships(record: RecordIdentity): void {
    const currentRecord = this.accessor.getRecordSync(record);
    if (currentRecord) {
      const inverseRelationships = getAllInverseRelationships(
        this.accessor.schema,
        currentRecord
      );
      if (inverseRelationships.length > 0) {
        this.accessor.removeInverseRelationshipsSync(inverseRelationships);
      }
    }
  }

  protected clearInverseRelationshipOps(
    record: RecordIdentity
  ): RecordOperation[] {
    return getInverseRelationshipRemovalOps(
      this.accessor.schema,
      this.accessor.getInverseRelationshipsSync(record)
    );
  }
}
