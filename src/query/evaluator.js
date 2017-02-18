import { isQueryExpression, QueryExpression } from '../query-expression';

export default class QueryEvaluator {
  constructor(target, operators) {
    this.target = target;
    this.operators = operators;
  }

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
}
