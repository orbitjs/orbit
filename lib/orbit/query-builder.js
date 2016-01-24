import { queryExpression as oqe } from 'orbit-common/oql/expressions';
import { Value } from 'orbit/query-builder/terms';

class QueryBuilder {
  constructor(options = {}) {
    this._options = options;

    options.terms = options.terms || {};
  }

  get(path) {
    return new Value(oqe('get', path));
  }

  // should probably go somewhere else
  or(a, b) {
    return oqe('or', a, b);
  }

  and(a, b) {
    return oqe('and', a, b);
  }
}

export default QueryBuilder;
