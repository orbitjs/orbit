import Orbit from './main';
import { QueryExpression } from './query-expression';
import { QueryTerm } from './query-term';
import QueryBuilder from './query-builder';

export type QueryBuilderFunc = (QueryBuilder) => QueryExpression;
export type QueryOrExpression = Query | QueryExpression | QueryTerm | QueryBuilderFunc;

/**
 * Queries are used to extract data from a source.
 *
 * Queries will be automatically assigned an `id` if none is specifically
 * assigned.
 *
 * @export
 * @class Query
 */
export default class Query {
  id: string;
  expression: QueryExpression;
  options: any;

  /**
   * Creates an instance of a `Query`.
   *
   * @param {QueryExpression} expression
   * @param {object} [options]
   * @param {string} [id=Orbit.uuid()]
   *
   * @memberOf Query
   */
  constructor(expression: QueryExpression, options?: object, id: string = Orbit.uuid()) {
    this.expression = expression;
    this.options = options;
    this.id = id;
  }

  /**
   * Create a new `Query` from a query or expression, if necessary.
   *
   * Accepts optional `options` and `id`.
   *
   * @static
   * @param {QueryOrExpression} queryOrExpression
   * @param {object} [options]
   * @param {string} [id]
   * @returns {Query}
   *
   * @memberOf Query
   */
  static from(queryOrExpression: QueryOrExpression, options?: object, id?: string, builder?: QueryBuilder): Query {
    if (queryOrExpression instanceof Query) {
      if (options && options !== queryOrExpression.options ||
          id && id !== queryOrExpression.id) {
        return new Query(queryOrExpression.expression, options || queryOrExpression.options, id);
      } else {
        return queryOrExpression;
      }
    } else if (queryOrExpression instanceof QueryTerm) {
      return new Query(queryOrExpression.toQueryExpression(), options, id);
    } else if (typeof queryOrExpression === 'function') {
      return Query.from(queryOrExpression(builder), options, id);
    } else {
      return new Query(queryOrExpression, options, id);
    }
  }
}
