import { capitalize } from 'orbit/lib/strings';
import { queryExpression as oqe } from 'orbit/query/expression';
import { Records, Record, RelatedRecord, RelatedRecords } from 'orbit-common/query/terms';

export default {
  recordsOfType(type) {
    const TypeTerm = this._terms[`${ capitalize(type) }Records`] || Records;

    return new TypeTerm(oqe('recordsOfType', type));
  },

  record(recordIdentity) {
    return new Record(recordIdentity);
  },

  relatedRecord(record, relationship) {
    return new RelatedRecord(record, relationship);
  },

  relatedRecords(record, relationship) {
    return new RelatedRecords(record, relationship);
  },

  or(a, b) {
    return oqe('or', a, b);
  },

  and(a, b) {
    return oqe('and', a, b);
  }
};
