import { isObject } from '../lib/objects';

class QueryExpression {
  constructor(op, args) {
    this.__oqe__ = true;
    this.op = op;
    this.args = args;
  }

  toString() {
    const formattedArgs = this.args.map(arg => '' + arg).join(', ');
    return `${this.op}(${formattedArgs})`;
  }
}

export function queryExpression(op, ...args) {
  return new QueryExpression(op, args);
}

export function isQueryExpression(obj) {
  return isObject(obj) && obj.__oqe__;
}

export default QueryExpression;
