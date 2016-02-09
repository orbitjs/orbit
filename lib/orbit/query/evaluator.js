import { Class } from '../lib/objects';
import { isQueryExpression } from './expression';
import QueryContext from './context';

export default Class.extend({
  target: null,

  operators: null,

  init(target, operators) {
    this.target = target;
    this.operators = operators;
  },

  evaluate(expression, _context) {
    if (isQueryExpression(expression)) {
      let operator = this.operators[expression.op];
      if (!operator) {
        throw new Error('Unable to find operator: ' + expression.op);
      }
      let context = _context || {};
      return operator.apply(this, [context].concat(expression.args));
    } else {
      return expression;
    }
  }
});
