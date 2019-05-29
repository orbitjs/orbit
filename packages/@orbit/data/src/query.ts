import Orbit from './main';
import { QueryExpression } from './query-expression';
import { QueryTerm } from './query-term';
import QueryBuilder from './query-builder';
import { isObject } from '@orbit/utils';

export type QueryBuilderFunc = (
  QueryBuilder: QueryBuilder
) => QueryExpression | QueryTerm;
export type QueryOrExpression =
  | Query
  | QueryExpression
  | QueryTerm
  | QueryBuilderFunc;

/**
 * Queries are used to extract data from a source.
 */
export interface Query {
  id: string;
  expression: QueryExpression;
  options?: any;
}

/**
 * A builder function for creating a Query from its constituent parts.
 *
 * If a `Query` is passed in with an `id` and `expression`, and no replacement
 * `id` or `options` are also passed in, then the `Query` will be returned
 * unchanged.
 *
 * For all other cases, a new `Query` object will be created and returned.
 *
 * Queries will be assigned the specified `queryId` as `id`. If none is
 * specified, a UUID will be generated.
 */
export function buildQuery(
  queryOrExpression: QueryOrExpression,
  queryOptions?: object,
  queryId?: string,
  queryBuilder?: QueryBuilder
): Query {
  if (typeof queryOrExpression === 'function') {
    return buildQuery(queryOrExpression(queryBuilder), queryOptions, queryId);
  } else {
    let query = queryOrExpression as Query;
    let expression: QueryExpression;
    let options: object;

    if (isObject(query) && query.expression) {
      if (query.id && !queryOptions && !queryId) {
        return query;
      }
      expression = query.expression;
      options = queryOptions || query.options;
    } else {
      if (queryOrExpression instanceof QueryTerm) {
        expression = queryOrExpression.toQueryExpression();
      } else {
        expression = queryOrExpression as QueryExpression;
      }
      options = queryOptions;
    }

    let id: string = queryId || Orbit.uuid();

    return { expression, options, id };
  }
}
