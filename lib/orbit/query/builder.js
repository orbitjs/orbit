import { merge } from 'orbit/lib/objects';
import { queryExpression as oqe } from './expression';
import { Value } from './terms';
import Query from '../query';

const defaultTerms = {
  get(path) {
    return new Value(oqe('get', path));
  },

  or(a, b) {
    return oqe('or', a, b);
  },

  and(a, b) {
    return oqe('and', a, b);
  }
};

export default class QueryBuilder {
  constructor(options = {}) {
    this.terms = defaultTerms;
  }

  build(fn) {
    return Query.from(fn(this.terms).expression);
  }
}
