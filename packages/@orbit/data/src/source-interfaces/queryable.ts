import { fulfillInSeries, Orbit, settleInSeries } from '@orbit/core';
import { Operation } from '../operation';
import { buildQuery, Query, QueryOrExpressions } from '../query';
import { QueryExpression } from '../query-expression';
import { AsyncQueryable } from '../queryable';
import { RequestOptions } from '../request';
import {
  FullResponse,
  mapNamedFullResponses,
  NamedFullResponse,
  ResponseHints
} from '../response';
import { Source, SourceClass } from '../source';

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
  Data,
  Details,
  O extends Operation,
  QE extends QueryExpression,
  QueryBuilder,
  Options extends RequestOptions = RequestOptions
> extends AsyncQueryable<Data, Details, O, QE, QueryBuilder, Options> {
  _query(
    query: Query<QE>,
    hints?: ResponseHints<Data, Details>
  ): Promise<FullResponse<Data, Details, O>>;
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
export function queryable(Klass: unknown): void {
  let proto = (Klass as SourceClass).prototype;

  if (isQueryable(proto)) {
    return;
  }

  assert(
    'Queryable interface can only be applied to a Source',
    proto instanceof Source
  );

  (proto as any)[QUERYABLE] = true;

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
    const response = await this._requestQueue.push({
      type: 'query',
      data: query
    });
    return options?.fullResponse ? response : response.data;
  };

  proto.__query__ = async function (
    query: Query<QueryExpression>
  ): Promise<FullResponse<unknown, unknown, Operation>> {
    try {
      const hints: ResponseHints<unknown, unknown> = {};
      const otherResponses = (await fulfillInSeries(
        this,
        'beforeQuery',
        query,
        hints
      )) as (NamedFullResponse<unknown, unknown, Operation> | undefined)[];
      const fullResponse = await this._query(query, hints);
      if (otherResponses.length > 0) {
        fullResponse.sources = mapNamedFullResponses(otherResponses);
      }
      if (fullResponse.transforms?.length > 0) {
        await this.transformed(fullResponse.transforms);
      }
      await settleInSeries(this, 'query', query, fullResponse);
      return fullResponse;
    } catch (error) {
      await settleInSeries(this, 'queryFail', query, error);
      throw error;
    }
  };
}
