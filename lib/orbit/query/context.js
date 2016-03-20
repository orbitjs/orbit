import { isQueryExpression } from './expression';

export default class QueryContext {
  constructor(evaluator) {
    this.evaluator = evaluator;
  }

  evaluate(expression) {
    if (isQueryExpression(expression)) {
      let operator = this.evaluator.operators[expression.op];

      if (!operator) { throw new Error('Unable to find operator: ' + expression.op); }

      return operator.evaluate(this, expression.args);
    } else {
      return expression;
    }
  }
}
