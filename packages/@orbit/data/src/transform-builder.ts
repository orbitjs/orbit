import {
  Record,
  RecordIdentity
} from './record';
import {
  AddRecordOperation,
  ReplaceRecordOperation,
  RemoveRecordOperation,
  ReplaceKeyOperation,
  ReplaceAttributeOperation,
  AddToHasManyOperation,
  RemoveFromHasManyOperation,
  ReplaceHasManyOperation,
  ReplaceHasOneOperation
} from './operation';
import { eq } from '@orbit/utils';

export default class TransformBuilder {
  /**
   * Instantiate a new `addRecord` operation.
   *
   * @param {Record} record
   * @returns {AddRecordOperation}
   */
  addRecord(record: Record): AddRecordOperation {
    return { op: 'addRecord', record};
  }

  /**
   * Instantiate a new `replaceRecord` operation.
   *
   * @param {Record} record
   * @returns {ReplaceRecordOperation}
   */
  replaceRecord(record: Record): ReplaceRecordOperation {
    return { op: 'replaceRecord', record};
  }

  /**
   * Instantiate a new `removeRecord` operation.
   *
   * @param {RecordIdentity} record
   * @returns {RemoveRecordOperation}
   */
  removeRecord(record: RecordIdentity): RemoveRecordOperation {
    return { op: 'removeRecord', record};
  }

  /**
   * Instantiate a new `replaceKey` operation.
   *
   * @param {RecordIdentity} record
   * @param {string} key
   * @param {string} value
   * @returns {ReplaceKeyOperation}
   */
  replaceKey(record: RecordIdentity, key: string, value: string): ReplaceKeyOperation {
    return { op: 'replaceKey', record, key, value };
  }

  /**
   * Instantiate a new `replaceAttribute` operation.
   *
   * @param {RecordIdentity} record
   * @param {string} attribute
   * @param {*} value
   * @returns {ReplaceAttributeOperation}
   */
  replaceAttribute(record: RecordIdentity, attribute: string, value: any): ReplaceAttributeOperation {
    return { op: 'replaceAttribute', record, attribute, value };
  }

  /**
   * Instantiate a new `addToHasMany` operation.
   *
   * @param {RecordIdentity} record
   * @param {string} relationship
   * @param {RecordIdentity} relatedRecord
   * @returns {AddToHasManyOperation}
   */
  addToHasMany(record: RecordIdentity, relationship: string, relatedRecord: RecordIdentity): AddToHasManyOperation {
    return { op: 'addToHasMany', record, relationship, relatedRecord };
  }

  /**
   * Instantiate a new `removeFromHasMany` operation.
   *
   * @param {RecordIdentity} record
   * @param {string} relationship
   * @param {RecordIdentity} relatedRecord
   * @returns {RemoveFromHasManyOperation}
   */
  removeFromHasMany(record: RecordIdentity, relationship: string, relatedRecord: RecordIdentity): RemoveFromHasManyOperation {
    return { op: 'removeFromHasMany', record, relationship, relatedRecord };
  }

  /**
   * Instantiate a new `replaceHasMany` operation.
   *
   * @param {RecordIdentity} record
   * @param {string} relationship
   * @param {RecordIdentity[]} relatedRecords
   * @returns {ReplaceHasManyOperation}
   */
  replaceHasMany(record: RecordIdentity, relationship: string, relatedRecords: RecordIdentity[]): ReplaceHasManyOperation {
    return { op: 'replaceHasMany', record, relationship, relatedRecords };
  }

  /**
   * Instantiate a new `replaceHasOne` operation.
   *
   * @param {RecordIdentity} record
   * @param {string} relationship
   * @param {RecordIdentity} relatedRecord
   * @returns {ReplaceHasOneOperation}
   */
  replaceHasOne(record: RecordIdentity, relationship: string, relatedRecord: RecordIdentity): ReplaceHasOneOperation {
    return { op: 'replaceHasOne', record, relationship, relatedRecord };
  }
}