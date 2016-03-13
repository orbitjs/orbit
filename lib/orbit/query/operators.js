import { queryExpression as oqe } from './expression';
import { Value } from './terms';

export default {
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
