import { oqe, QueryExpression } from './query-expression';
import { RecordIdentity } from './record';
import { QueryTerm, RecordsTerm, RecordTerm, RelatedRecordTerm, RelatedRecordsTerm } from './query-term';

/**
 * A builder for record-specific queries.
 * 
 * `oqb` is an abbreviation for "Orbit Query Builder".
 * 
 * @export
 */
export const oqb = {
  /**
   * Find all records of a specific type.
   * 
   * If `type` is unspecified, find all records unfiltered by type.
   * 
   * @param {string} [type] 
   * @returns {RecordsTerm} 
   */
  records(type?: string): RecordsTerm {
    return new RecordsTerm(oqe('records', type));
  },

  /**
   * Find a record by its identity.
   * 
   * @param {RecordIdentity} recordIdentity 
   * @returns {Record} 
   */
  record(recordIdentity: RecordIdentity): RecordTerm {
    return new RecordTerm(recordIdentity);
  },

  /**
   * Find a record in a to-one relationship.
   * 
   * @param {RecordIdentity} record 
   * @param {string} relationship 
   * @returns {RelatedRecordTerm} 
   */
  relatedRecord(record: RecordIdentity, relationship: string): RelatedRecordTerm {
    return new RelatedRecordTerm(record, relationship);
  },

  /**
   * Find records in a to-many relationship.
   * 
   * @param {RecordIdentity} record 
   * @param {string} relationship 
   * @returns {RelatedRecordsTerm} 
   */
  relatedRecords(record: RecordIdentity, relationship: string): RelatedRecordsTerm {
    return new RelatedRecordsTerm(record, relationship);
  },

  /**
   * Logically "or" conditions together.
   * 
   * @param {*} a 
   * @param {*} b 
   * @returns {QueryExpression} 
   */
  or(a: any, b: any): QueryExpression {
    return oqe('or', a, b);
  },

  /**
   * Logically "and" conditions together.
   * 
   * @param {*} a 
   * @param {*} b 
   * @returns {QueryExpression} 
   */
  and(a: any, b: any): QueryExpression {
    return oqe('and', a, b);
  }
};
