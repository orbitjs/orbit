import Query from '../query';

export default class QueryBuilder {
  constructor(options = {}) {
    this.operators = options.operators || {};
  }

  build(fn) {
    return Query.from(fn(this.operators).expression);
  }
}
