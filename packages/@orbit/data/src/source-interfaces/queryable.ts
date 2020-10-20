import { Orbit, settleInSeries, fulfillInSeries } from '@orbit/core';
import { Query, QueryOrExpressions, buildQuery } from '../query';
import { Source, SourceClass } from '../source';
import { RequestOptions } from '../request';
import {
  createRequestedResponse,
  DataOrFullResponse,
  NamedResponse,
  ResponseHints,
  FullResponse
} from '../response';
import { Operation } from '../operation';
import { QueryExpression } from '../query-expression';

const { assert } = Orbit;

const QUERYABLE = '__queryable__';

/**
 * Has a source been decorated as `@queryable`?
 */
export function isQueryable(source: Source): boolean {
  return !!(source as { [QUERYABLE]?: boolean })[QUERYABLE];
}

/**
 * A source decorated as `@queryable` must also implement the `Queryable`
 * interface.
 */
export interface Queryable<
  D,
  R,
  O extends Operation,
  QE extends QueryExpression,
  QB
> {
  /**
   * The `query` method accepts a `Query` instance. It evaluates the query and
   * returns a promise that resolves to a static set of results.
   */
  query(
    queryOrExpressions: QueryOrExpressions<QE, QB>,
    options?: RequestOptions,
    id?: string
  ): Promise<DataOrFullResponse<D, R, O>>;

  _query(
    query: Query<QE>,
    hints?: ResponseHints<D>
  ): Promise<FullResponse<D, R, O>>;
}

/**
 * Marks a source as "queryable" and adds an implementation of the `Queryable`
 * interface.
 *
 * The `query` method is part of the "request flow" in Orbit. Requests trigger
 * events before and after processing of each request. Observers can delay the
 * resolution of a request by returning a promise in an event listener.
 *
 * The `Queryable` interface introduces the following events:
 *
 * - `beforeQuery` - emitted prior to the processing of `query`, this event
 * includes the requested `Query` as an argument.
 *
 * - `query` - emitted after a `query` has successfully returned, this event's
 * arguments include both the requested `Query` and the results.
 *
 * - `queryFail` - emitted when an error has occurred processing a query, this
 * event's arguments include both the requested `Query` and the error.
 *
 * A queryable source must implement a private method `_query`, which performs
 * the processing required for `query` and returns a promise that resolves to a
 * set of results.
 */
export function queryable(Klass: SourceClass): void {
  let proto = Klass.prototype;

  if (isQueryable(proto)) {
    return;
  }

  assert(
    'Queryable interface can only be applied to a Source',
    proto instanceof Source
  );

  proto[QUERYABLE] = true;

  proto.query = async function (
    queryOrExpressions: QueryOrExpressions<QueryExpression, unknown>,
    options?: RequestOptions,
    id?: string
  ): Promise<unknown> {
    await this.activated;
    const query = buildQuery(
      queryOrExpressions,
      options,
      id,
      this.queryBuilder
    );
    return this._enqueueRequest('query', query);
  };

  proto.__query__ = async function (
    query: Query<QueryExpression>
  ): Promise<DataOrFullResponse<unknown, unknown, Operation>> {
    try {
      const hints: ResponseHints<unknown> = {};
      const otherResponses = (await fulfillInSeries(
        this,
        'beforeQuery',
        query,
        hints
      )) as NamedResponse<unknown, unknown, Operation>[];
      const response = createRequestedResponse<unknown, unknown, Operation>(
        await this._query(query, hints),
        otherResponses,
        query.options
      );
      await settleInSeries(this, 'query', query, response);
      return response;
    } catch (error) {
      await settleInSeries(this, 'queryFail', query, error);
      throw error;
    }
  };
}
