import { queryExpression as oqe } from '../query-expression';
import { Records, Record, RelatedRecord, RelatedRecords } from './terms';

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
