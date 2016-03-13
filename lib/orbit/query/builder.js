import { merge } from 'orbit/lib/objects';
import { queryExpression as oqe } from './expression';
import { Value } from './terms';
import Query from '../query';
import Operators from './operators';

export default class QueryBuilder {
  constructor(options = {}) {
    this.operators = Operators;
  }

  build(fn) {
    return Query.from(fn(this.operators).expression);
  }
}
