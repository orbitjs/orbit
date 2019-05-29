import { RecordOperation } from '@orbit/data';
import { AsyncOperationProcessor } from '../async-operation-processor';
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
export default class AsyncSchemaConsistencyProcessor extends AsyncOperationProcessor {
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
          await this.accessor.getRelatedRecordAsync(
            operation.record,
            operation.relationship
          ),
          operation.relatedRecord
        );

      case 'replaceRelatedRecords':
        return relatedRecordsReplaced(
          this.accessor.schema,
          operation.record,
          operation.relationship,
          await this.accessor.getRelatedRecordsAsync(
            operation.record,
            operation.relationship
          ),
          operation.relatedRecords
        );

      case 'removeFromRelatedRecords':
        return relatedRecordRemoved(
          this.accessor.schema,
          operation.record,
          operation.relationship,
          await this.accessor.getRecordAsync(operation.relatedRecord),
          operation.relatedRecord
        );

      case 'removeRecord':
        return recordRemoved(
          this.accessor.schema,
          await this.accessor.getRecordAsync(operation.record)
        );

      case 'updateRecord':
        return recordReplaced(
          this.accessor.schema,
          await this.accessor.getRecordAsync(operation.record),
          operation.record
        );

      default:
        return [];
    }
  }
}
