import { isQueryExpression, QueryExpression } from '@orbit/data';
import { Dict } from '@orbit/utils';

/**
 * @export
 * @interface QueryOperator
 */
export interface QueryOperator {
  (...expression: any[]): any;
}

/**
 * @export
 * @interface QueryOperator
 */
export interface ContextualQueryOperator {
  (context: any, ...expression: any[]): any;
}

/**
 *
 *
 * @export
 * @class QueryEvaluator
 */
export default class QueryEvaluator {
  target: any;
  operators: Dict<QueryOperator>;
  contextualOperators: Dict<ContextualQueryOperator>;

  constructor(target: any, operators: Dict<QueryOperator>, contextualOperators: Dict<ContextualQueryOperator>) {
    this.target = target;
    this.operators = operators;
    this.contextualOperators = contextualOperators;
  }

  evaluate(expression: QueryExpression, context?: any): any {
    if (isQueryExpression(expression)) {
      let args, operator;

      if (context) {
        operator = this.contextualOperators[expression.op];
        args = [context].concat(expression.args);
      } else {
        operator = this.operators[expression.op];
        args = expression.args;
      }
      if (!operator) {
        throw new Error('Unable to find operator: ' + expression.op);
      }
      return operator.apply(this, args);
    } else {
      return expression;
    }
  }
}
