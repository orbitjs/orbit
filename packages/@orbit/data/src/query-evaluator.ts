import { isQueryExpression, QueryExpression } from './query-expression';
import { Dict } from '@orbit/utils';

export interface QueryOperator {
  (context: any, ...expression: any[]): any;
}

export default class QueryEvaluator {
  target: any;
  operators: Dict<QueryOperator>;

  constructor(target: any, operators: Dict<QueryOperator>) {
    this.target = target;
    this.operators = operators;
  }

  evaluate(expression: QueryExpression, context: object = {}): any {
    if (isQueryExpression(expression)) {
      let operator = this.operators[expression.op];
      if (!operator) {
        throw new Error('Unable to find operator: ' + expression.op);
      }
      return operator.apply(this, [context].concat(expression.args));
    } else {
      return expression;
    }
  }
}
