import Orbit from './main';
import { QueryExpression } from './query-expression';
import { QueryTerm } from './query-term';
import QueryBuilder from './query-builder';
import { isObject } from '@orbit/utils';
import { RequestOptions } from './request';

export type QueryBuilderFunc = (
  QueryBuilder: QueryBuilder
) => QueryExpression | QueryExpression[] | QueryTerm | QueryTerm[];
export type QueryOrExpressions =
  | Query
  | QueryExpression
  | QueryExpression[]
  | QueryTerm
  | QueryTerm[]
  | QueryBuilderFunc;

/**
 * Queries are used to extract data from a source.
 */
export interface Query {
  id: string;
  expressions: QueryExpression[];
  options?: RequestOptions;
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
  queryOrExpressions: QueryOrExpressions,
  queryOptions?: RequestOptions,
  queryId?: string,
  queryBuilder?: QueryBuilder
): Query {
  if (typeof queryOrExpressions === 'function') {
    return buildQuery(queryOrExpressions(queryBuilder), queryOptions, queryId);
  } else {
    let query = queryOrExpressions as Query;
    let expressions: QueryExpression[];
    let options: RequestOptions;

    if (isQuery(query)) {
      if (query.id && !queryOptions && !queryId) {
        return query;
      }
      expressions = query.expressions;
      options = queryOptions || query.options;
    } else if (Array.isArray(queryOrExpressions)) {
      expressions = [];
      for (let queryOrExpression of queryOrExpressions) {
        if (queryOrExpression instanceof QueryTerm) {
          expressions.push(queryOrExpression.toQueryExpression());
        } else {
          expressions.push(queryOrExpression);
        }
      }
      options = queryOptions;
    } else {
      if (queryOrExpressions instanceof QueryTerm) {
        expressions = [queryOrExpressions.toQueryExpression()];
      } else {
        expressions = [queryOrExpressions] as QueryExpression[];
      }
      options = queryOptions;
    }

    let id: string = queryId || Orbit.uuid();

    return {
      expressions,
      options,
      id
    };
  }
}

function isQuery(query: QueryOrExpressions): query is Query {
  return isObject(query) && (query as any).expressions;
}
