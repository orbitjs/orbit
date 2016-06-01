import { capitalize } from 'orbit/lib/strings';
import { queryExpression as oqe } from 'orbit/query/expression';
import { Records, Record, RelatedRecord, RelatedRecords } from 'orbit-common/query/terms';

export function recordsOfType(type) {
  return new Records(oqe('recordsOfType', type));
}

export function record(recordIdentity) {
  return new Record(recordIdentity);
}

export function relatedRecord(record, relationship) {
  return new RelatedRecord(record, relationship);
}

export function relatedRecords(record, relationship) {
  return new RelatedRecords(record, relationship);
}

export function or(a, b) {
  return oqe('or', a, b);
}

export function and(a, b) {
  return oqe('and', a, b);
}

export function equal(a, b) {
  return oqe('equal', a, b);
}

export function attribute(recordIdentity, attribute) {
  return oqe('attribute', recordIdentity, attribute);
}

export function key(recordIdentity, key) {
  return oqe('key', recordIdentity, key);
}

export default {
  recordsOfType,
  record,
  relatedRecord,
  relatedRecords,
  or,
  and
};
