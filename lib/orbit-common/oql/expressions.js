import { Class, isObject } from 'orbit/lib/objects';

var QueryExpression = Class.extend({
  __oqe__: true,
  op: null,
  args: null,
  init(op, args) {
    this.op = op;
    this.args = args;
  },

  toString() {
    const formattedArgs = this.args.map(arg => '' + arg).join(', ');
    return `${this.op}(${formattedArgs})`;
  }
});

function queryExpression(op) {
  return new QueryExpression(op, Array.prototype.slice.call(arguments, 1));
}

function isQueryExpression(obj) {
  return isObject(obj) && obj.__oqe__;
}

export {
  QueryExpression,
  queryExpression,
  isQueryExpression
};
