import { deepMerge } from '@orbit/utils';
import { QueryExpression } from './query-expression';
import { RequestOptions } from './request';

/**
 * Query terms are used by query builders to allow for the construction of
 * query expressions in composable patterns.
 */
export class QueryTerm<QE extends QueryExpression> {
  expression: QE;

  constructor(expression: QE) {
    this.expression = expression;
  }

  toQueryExpression(): QE {
    return this.expression;
  }

  options(options: RequestOptions): this {
    this.expression.options = deepMerge(this.expression.options || {}, options);
    return this;
  }
}
