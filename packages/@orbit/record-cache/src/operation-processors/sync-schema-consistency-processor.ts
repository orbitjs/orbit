import { RecordOperation } from '@orbit/records';
import { SyncOperationProcessor } from '../sync-operation-processor';
import {
  recordAdded,
  relatedRecordAdded,
  relatedRecordRemoved,
  relatedRecordReplaced,
  relatedRecordsReplaced,
  recordRemoved,
  recordUpdated
} from './utils/schema-consistency-utils';

/**
 * An operation processor that ensures that a cache's data is consistent with
 * its associated schema. This includes maintenance of inverse and dependent
 * relationships.
 */
export class SyncSchemaConsistencyProcessor extends SyncOperationProcessor {
  after(operation: RecordOperation): RecordOperation[] {
    switch (operation.op) {
      case 'addRecord':
        return recordAdded(this.accessor.schema, operation.record);

      case 'addToRelatedRecords':
        return relatedRecordAdded(
          this.accessor.schema,
          operation.record,
          operation.relationship,
          operation.relatedRecord
        );

      case 'replaceRelatedRecord':
        return relatedRecordReplaced(
          this.accessor.schema,
          operation.record,
          operation.relationship,
          operation.relatedRecord,
          this.accessor.getRelatedRecordSync(
            operation.record,
            operation.relationship
          )
        );

      case 'replaceRelatedRecords':
        return relatedRecordsReplaced(
          this.accessor.schema,
          operation.record,
          operation.relationship,
          operation.relatedRecords,
          this.accessor.getRelatedRecordsSync(
            operation.record,
            operation.relationship
          )
        );

      case 'removeFromRelatedRecords':
        return relatedRecordRemoved(
          this.accessor.schema,
          operation.record,
          operation.relationship,
          operation.relatedRecord,
          this.accessor.getRecordSync(operation.relatedRecord)
        );

      case 'removeRecord':
        return recordRemoved(
          this.accessor.schema,
          this.accessor.getRecordSync(operation.record)
        );

      case 'updateRecord':
        return recordUpdated(
          this.accessor.schema,
          operation.record,
          this.accessor.getRecordSync(operation.record)
        );

      default:
        return [];
    }
  }
}
