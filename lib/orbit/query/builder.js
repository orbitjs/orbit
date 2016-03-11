import { queryExpression as oqe } from './expression';
import { Value } from './terms';
import Query from '../query';

export default class QueryBuilder {
  constructor(options = {}) {
    this._options = options;

    options.terms = options.terms || {};
  }

  build(fn) {
    return Query.from(fn(this).expression);
  }

  get(path) {
    return new Value(oqe('get', path));
  }

  or(a, b) {
    return oqe('or', a, b);
  }

  and(a, b) {
    return oqe('and', a, b);
  }
}
