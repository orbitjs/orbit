import { capitalize } from 'orbit/lib/strings';
import { queryExpression as oqe } from 'orbit/query/expression';
import { Records, Record } from 'orbit-common/query/terms';

export default {
  recordsOfType(type) {
    const TypeTerm = this._terms[`${ capitalize(type) }Records`] || Records;

    return new TypeTerm(oqe('recordsOfType', type));
  },

  record(type, id) {
    return new Record(type, id);
  }
};
