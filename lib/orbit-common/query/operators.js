import { capitalize } from 'orbit/lib/strings';
import { queryExpression as oqe } from 'orbit/query/expression';
import { Records, Record, RelatedRecord, RelatedRecords } from 'orbit-common/query/terms';

export default {
  recordsOfType(type) {
    const TypeTerm = this._terms[`${ capitalize(type) }Records`] || Records;

    return new TypeTerm(oqe('recordsOfType', type));
  },

  record(type, id) {
    return new Record(type, id);
  },

  relatedRecord(type, id, relationship) {
    return new RelatedRecord(type, id, relationship);
  },

  relatedRecords(type, id, relationship) {
    return new RelatedRecords(type, id, relationship);
  },

  or(a, b) {
    return oqe('or', a, b);
  },

  and(a, b) {
    return oqe('and', a, b);
  }
};
