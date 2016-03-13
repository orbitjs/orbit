import { queryExpression as oqe } from 'orbit/query/expression';
import { Records } from 'orbit-common/query/terms';

export default {
  recordsOfType(type) {
    const TypeTerm = this._typeTerms[type] || Records;

    return new TypeTerm(oqe('recordsOfType', type));
  }
};
