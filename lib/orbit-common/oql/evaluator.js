import {
  Class,
  isArray
} from 'orbit/lib/objects';
import {
  isQueryExpression
} from './expressions';

var QueryContext = Class.extend({
  evaluator: null,

  init(evaluator) {
    this.evaluator = evaluator;
  },

  evaluate(expression) {
    if (isQueryExpression(expression)) {
      let operator = this.evaluator.operators[expression.op];

      if (!operator) { throw new Error('Unable to find operation: ' + expression.op); }

      return operator.evaluate(this, expression.args);
    } else {
      return expression;
    }
  }
});

var QueryEvaluator = Class.extend({
  target: null,

  operators: null,

  init(target, operators) {
    this.target = target;
    this.operators = operators;
  },

  evaluate(expression) {
    let context = new QueryContext(this);
    return context.evaluate(expression);
  }
});

export {
  QueryContext,
  QueryEvaluator
};
