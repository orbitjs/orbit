import { Records, Record, RelatedRecord, RelatedRecords } from 'orbit-common/query/terms';
import { queryExpression as oqe } from 'orbit/query/expression';

export default {
  records(type) {
    return new Records(oqe('records', type));
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
