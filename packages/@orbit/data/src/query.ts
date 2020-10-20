import { Orbit } from '@orbit/core';
import { QueryTerm } from './query-term';
import { RequestOptions } from './request';
import { QueryExpression } from './query-expression';

/**
 * Queries are used to extract data from a source.
 */
export interface Query<QE extends QueryExpression> {
  id: string;
  expressions: QE[];
  options?: RequestOptions;
}

export type QueryBuilderFunc<QE extends QueryExpression, QB> = (
  QueryBuilder: QB
) => QE | QE[] | QueryTerm<QE> | QueryTerm<QE>[];

export type QueryOrExpressions<QE extends QueryExpression, QB> =
  | Query<QE>
  | QE
  | QE[]
  | QueryTerm<QE>
  | QueryTerm<QE>[]
  | QueryBuilderFunc<QE, QB>;

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
export function buildQuery<QE extends QueryExpression, QB = unknown>(
  queryOrExpressions: QueryOrExpressions<QE, QB>,
  queryOptions?: RequestOptions,
  queryId?: string,
  queryBuilder?: QB
): Query<QE> {
  if (typeof queryOrExpressions === 'function') {
    const queryBuilderFn = queryOrExpressions as QueryBuilderFunc<QE, QB>;
    return buildQuery<QE, QB>(
      queryBuilderFn(queryBuilder as QB),
      queryOptions,
      queryId
    );
  } else {
    let query = queryOrExpressions as Query<QE>;
    let expressions: QE[];
    let options: RequestOptions | undefined;

    if (isQuery(query)) {
      if (query.id && !queryOptions && !queryId) {
        return query;
      }
      expressions = query.expressions;
      options = queryOptions || query.options;
    } else if (Array.isArray(queryOrExpressions)) {
      expressions = [];
      for (let queryOrExpression of queryOrExpressions) {
        expressions.push(toQueryExpression<QE>(queryOrExpression));
      }
      options = queryOptions;
    } else {
      expressions = [
        toQueryExpression(queryOrExpressions as QE | QueryTerm<QE>)
      ];
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

function toQueryExpression<QE extends QueryExpression = QueryExpression>(
  expression: QE | QueryTerm<QE>
): QE {
  if (isQueryTerm(expression)) {
    return (expression as QueryTerm<QE>).toQueryExpression();
  } else {
    return expression;
  }
}

function isQueryTerm<QE extends QueryExpression = QueryExpression>(
  expression: QE | QueryTerm<QE>
): expression is QueryTerm<QE> {
  return typeof (expression as QueryTerm<QE>).toQueryExpression === 'function';
}

function isQuery<QE extends QueryExpression = QueryExpression>(
  query: QueryOrExpressions<QE, unknown>
): query is Query<QE> {
  return Array.isArray((query as Query<QE>).expressions);
}
