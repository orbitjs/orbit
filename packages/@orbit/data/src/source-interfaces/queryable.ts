import { Orbit, settleInSeries, fulfillInSeries } from '@orbit/core';
import { Query, QueryOrExpressions, buildQuery } from '../query';
import { Source, SourceClass } from '../source';
import { RequestOptions } from '../request';
import {
  DataOrFullResponse,
  NamedFullResponse,
  ResponseHints,
  FullResponse,
  mapNamedFullResponses
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
  Data,
  Details,
  O extends Operation,
  QE extends QueryExpression,
  QueryBuilder
> {
  /**
   * The `query` method accepts a `Query` instance. It evaluates the query and
   * returns a promise that resolves to a static set of results.
   */
  query(
    queryOrExpressions: QueryOrExpressions<QE, QueryBuilder>,
    options?: RequestOptions,
    id?: string
  ): Promise<DataOrFullResponse<Data, Details, O>>;

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

  proto[QUERYABLE] = true;

  proto.query = async function (
    queryOrExpressions: QueryOrExpressions<QueryExpression, unknown>,
    options?: RequestOptions,
    id?: string
  ): Promise<DataOrFullResponse<unknown, unknown, Operation>> {
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
      const options = query.options || {};
      const hints: ResponseHints<unknown, unknown> = {};
      const otherResponses = (await fulfillInSeries(
        this,
        'beforeQuery',
        query,
        hints
      )) as (NamedFullResponse<unknown, unknown, Operation> | undefined)[];
      const fullResponse = await this._query(query, hints);
      if (options.includeSources) {
        fullResponse.sources = otherResponses
          ? mapNamedFullResponses<unknown, unknown, Operation>(otherResponses)
          : {};
      }
      if (fullResponse.transforms?.length > 0) {
        await this.transformed(fullResponse.transforms);
      }
      await settleInSeries(this, 'query', query, fullResponse);
      return options.fullResponse ? fullResponse : fullResponse.data;
    } catch (error) {
      await settleInSeries(this, 'queryFail', query, error);
      throw error;
    }
  };
}
