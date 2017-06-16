import { RecordIdentity } from './record';
import { QueryTerm, FindRecordTerm, FindRecordsTerm, FindRelatedRecordTerm, FindRelatedRecordsTerm } from './query-term';

export default class QueryBuilder {
  /**
   * Find a record by its identity.
   *
   * @param {RecordIdentity} recordIdentity
   * @returns {FindRecordTerm}
   */
  findRecord(record: RecordIdentity): FindRecordTerm {
    return new FindRecordTerm(record);
  }

  /**
   * Find all records of a specific type.
   *
   * If `type` is unspecified, find all records unfiltered by type.
   *
   * @param {string} [type]
   * @returns {FindRecordsTerm}
   */
  findRecords(type?: string): FindRecordsTerm {
    return new FindRecordsTerm(type);
  }

  /**
   * Find a record in a to-one relationship.
   *
   * @param {RecordIdentity} record
   * @param {string} relationship
   * @returns {FindRelatedRecordTerm}
   */
  findRelatedRecord(record: RecordIdentity, relationship: string): FindRelatedRecordTerm {
    return new FindRelatedRecordTerm(record, relationship);
  }

  /**
   * Find records in a to-many relationship.
   *
   * @param {RecordIdentity} record
   * @param {string} relationship
   * @returns {FindRelatedRecordsTerm}
   */
  findRelatedRecords(record: RecordIdentity, relationship: string): FindRelatedRecordsTerm {
    return new FindRelatedRecordsTerm(record, relationship);
  }
}
