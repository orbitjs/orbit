import { QueryExpression } from '@orbit/data';
import { Dict } from '@orbit/utils';

/**
 * @export
 * @interface QueryOperator
 */
export interface QueryOperator {
  (expression: QueryExpression): any;
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

  constructor(target: any, operators: Dict<QueryOperator>) {
    this.target = target;
    this.operators = operators;
  }

  evaluate(expression: QueryExpression): any {
    const operator = this.operators[expression.op];
    if (!operator) {
      throw new Error('Unable to find operator: ' + expression.op);
    }
    return operator.call(this, expression);
  }
}
