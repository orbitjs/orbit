import { queryExpression as oqe } from './expression';
import Query from 'orbit/query';

export class TermBase {
  constructor(expression) {
    this.expression = expression;
  }
}

export class Cursor extends TermBase {
  get(path) {
    return new Value(oqe('get', path));
  }
}

export class Value extends TermBase {
  equal(value) {
    return oqe('equal', this.expression, value);
  }
}
