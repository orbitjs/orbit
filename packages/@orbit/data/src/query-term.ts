import { deepMerge } from '@orbit/utils';
import { QueryExpression } from './query-expression';
import { RequestOptions } from './request';

/**
 * Query terms are used by query builders to allow for the construction of
 * query expressions in composable patterns.
 */
export class QueryTerm<QE extends QueryExpression> {
  protected _expression: QE;

  constructor(expression: QE) {
    this._expression = expression;
  }

  toQueryExpression(): QE {
    return this._expression;
  }

  options(options: RequestOptions): this {
    this._expression.options = deepMerge(
      this._expression.options || {},
      options
    );
    return this;
  }
}
