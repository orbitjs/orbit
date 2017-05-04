import { assert } from '@orbit/utils';
import { settleInSeries, fulfillInSeries } from '@orbit/core';
import Query, { QueryOrExpression } from '../query';
import { Source, SourceClass } from '../source';

export const QUERYABLE = '__queryable__';

/**
 * Has a source been decorated as `@queryable`?
 * 
 * @export
 * @param {object} obj 
 * @returns 
 */
export function isQueryable(source: Source) {
  return !!source[QUERYABLE];
}

/**
 * A source decorated as `@queryable` must also implement the `Queryable`
 * interface.
 *
 * @export
 * @interface Queryable
 */
export interface Queryable {
  /**
   * The `query` method accepts a `Query` instance. It evaluates the query and
   * returns a promise that resolves to a static set of results.
   *
   * @param {QueryOrExpression} queryOrExpression
   * @param {object} [options]
   * @param {string} [id]
   * @returns {Promise<any>}
   *
   * @memberOf Queryable
   */
  query(queryOrExpression: QueryOrExpression, options?: object, id?: string): Promise<any>;

  _query(query: Query): Promise<any>;
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
 *
 * @export
 * @decorator
 * @param {SourceClass} Klass 
 * @returns {void} 
 */
export default function queryable(Klass: SourceClass): void {
  let proto = Klass.prototype;

  if (isQueryable(proto)) {
    return;
  }

  assert('Queryable interface can only be applied to a Source', proto instanceof Source);

  proto[QUERYABLE] = true;

  proto.query = function(queryOrExpression: QueryOrExpression, options?: object, id?: string): Promise<any> {
    const query = Query.from(queryOrExpression, options, id);
    return this._enqueueRequest('query', query);
  }

  proto.__query__ = function(query: Query): Promise<any> {
    return fulfillInSeries(this, 'beforeQuery', query)
      .then(() => this._query(query))
      .then((result) => {
        return settleInSeries(this, 'query', query, result)
          .then(() => result);
      })
      .catch((error) => {
        return settleInSeries(this, 'queryFail', query, error)
          .then(() => { throw error; });
      });
  }
}
