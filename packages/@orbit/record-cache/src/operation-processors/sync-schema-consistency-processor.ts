import {
  RecordOperation
} from '@orbit/data';
import { SyncOperationProcessor } from '../sync-operation-processor';
import {
  recordAdded,
  relatedRecordAdded,
  relatedRecordRemoved,
  relatedRecordReplaced,
  relatedRecordsReplaced,
  recordRemoved,
  recordReplaced
} from './utils/schema-consistency-utils';

/**
 * An operation processor that ensures that a cache's data is consistent with
 * its associated schema. This includes maintenance of inverse and dependent
 * relationships.
 */
export default class SyncSchemaConsistencyProcessor extends SyncOperationProcessor {
  after(operation: RecordOperation): RecordOperation[] {
    switch (operation.op) {
      case 'addRecord':
        return recordAdded(
          this.accessor.schema,
          operation.record
        );

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
          this.accessor.getRelatedRecordSync(operation.record, operation.relationship),
          operation.relatedRecord
        );

      case 'replaceRelatedRecords':
        return relatedRecordsReplaced(
          this.accessor.schema,
          operation.record,
          operation.relationship,
          this.accessor.getRelatedRecordsSync(operation.record, operation.relationship),
          operation.relatedRecords
        );

      case 'removeFromRelatedRecords':
        return relatedRecordRemoved(
          this.accessor.schema,
          operation.record,
          operation.relationship,
          this.accessor.getRecordSync(operation.relatedRecord),
          operation.relatedRecord
        );

      case 'removeRecord':
        return recordRemoved(
          this.accessor.schema,
          this.accessor.getRecordSync(operation.record)
        );

      case 'updateRecord':
        return recordReplaced(
          this.accessor.schema,
          this.accessor.getRecordSync(operation.record),
          operation.record
        );

      default:
        return [];
    }
  }
}
