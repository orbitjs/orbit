import { assert } from '@orbit/utils';
import { settleInSeries, fulfillInSeries } from '../evented';
import Query from '../query';
import { Source } from '../source';

export const QUERYABLE = '__queryable__';

export function isQueryable(obj: any) {
  return !!obj[QUERYABLE];
}

export interface Queryable {
  query(query: Query): Promise<any>;
}

/**
  Mixes the `Queryable` interface into a source.

  The `Queryable` interface adds a single method to a source: `query`. This
  method accepts a `Query` instance or query expression which it then converts
  to a `Query` instance. The source evaluates the query and returns a promise
  that resolves to a static set of results.

  This interface is part of the "request flow" in Orbit. Requests trigger events
  before and after processing of each request. Observers can delay the
  resolution of a request by returning a promise in an event listener.

  The `Queryable` interface introduces the following events:

  * `beforeQuery` - emitted prior to the processing of `query`, this event
    includes the requested `Query` as an argument.

  * `query` - emitted after a `query` has successfully returned, this
    event's arguments include both the requested `Query` and the results.

  * `queryFail` - emitted when an error has occurred processing a query, this
    event's arguments include both the requested `Query` and the error.

  A `Queryable` source must implement a private method `_query`, which performs
  the processing required for `query` and returns a promise that resolves to a
  set of results.

  @function queryable
  @param {Object} source - Source class to decorate
  */

export default function queryable(Klass: any): void {
  let proto = Klass.prototype;

  if (isQueryable(proto)) {
    return;
  }

  assert('Queryable interface can only be applied to a Source', proto instanceof Source);

  proto[QUERYABLE] = true;

  proto.query = function(query: Query): Promise<any> {
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
