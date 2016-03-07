import { isObject } from 'orbit/lib/objects';

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

export function queryExpression(op) {
  return new QueryExpression(op, Array.prototype.slice.call(arguments, 1));
}

export function isQueryExpression(obj) {
  return isObject(obj) && obj.__oqe__;
}

export default QueryExpression;
