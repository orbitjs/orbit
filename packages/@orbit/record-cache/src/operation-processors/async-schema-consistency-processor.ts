import { RecordOperation } from '@orbit/records';
import { AsyncOperationProcessor } from '../async-operation-processor';
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
export class AsyncSchemaConsistencyProcessor extends AsyncOperationProcessor {
  async after(operation: RecordOperation): Promise<RecordOperation[]> {
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
          await this.accessor.getRelatedRecordAsync(
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
          await this.accessor.getRelatedRecordsAsync(
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
          await this.accessor.getRecordAsync(operation.relatedRecord)
        );

      case 'removeRecord':
        return recordRemoved(
          this.accessor.schema,
          await this.accessor.getRecordAsync(operation.record)
        );

      case 'updateRecord':
        return recordUpdated(
          this.accessor.schema,
          operation.record,
          await this.accessor.getRecordAsync(operation.record)
        );

      default:
        return [];
    }
  }
}
