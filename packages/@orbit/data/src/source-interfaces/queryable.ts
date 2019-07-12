import Orbit, { settleInSeries, fulfillInSeries } from '@orbit/core';
import { Query, QueryOrExpression, buildQuery } from '../query';
import { Source, SourceClass } from '../source';

const { assert } = Orbit;

export const QUERYABLE = '__queryable__';

/**
 * Has a source been decorated as `@queryable`?
 */
export function isQueryable(source: any) {
  return !!source[QUERYABLE];
}

/**
 * A source decorated as `@queryable` must also implement the `Queryable`
 * interface.
 */
export interface Queryable {
  /**
   * The `query` method accepts a `Query` instance. It evaluates the query and
   * returns a promise that resolves to a static set of results.
   */
  query(
    queryOrExpression: QueryOrExpression,
    options?: object,
    id?: string
  ): Promise<any>;

  _query(query: Query, hints?: any): Promise<any>;
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
export default function queryable(Klass: SourceClass): void {
  let proto = Klass.prototype;

  if (isQueryable(proto)) {
    return;
  }

  assert(
    'Queryable interface can only be applied to a Source',
    proto instanceof Source
  );

  proto[QUERYABLE] = true;

  proto.query = async function(
    queryOrExpression: QueryOrExpression,
    options?: object,
    id?: string
  ): Promise<any> {
    await this.activated;
    const query = buildQuery(queryOrExpression, options, id, this.queryBuilder);
    return this._enqueueRequest('query', query);
  };

  proto.__query__ = async function(query: Query): Promise<any> {
    try {
      const hints: any = {};

      await fulfillInSeries(this, 'beforeQuery', query, hints);
      let result = await this._query(query, hints);
      return settleInSeries(this, 'query', query, result).then(() => result);
    } catch (error) {
      await settleInSeries(this, 'queryFail', query, error);
      throw error;
    }
  };
}
