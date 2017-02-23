import { assert } from '../utils/assert';
import { extend } from '../utils/objects';
import { settleInSeries, fulfillInSeries } from '../evented';
import Source from '../source';
import Query from '../query';
import Transform from '../transform';

export const PULLABLE = '__pullable__';

export function isPullable(obj: any) {
  return !!obj[PULLABLE];  
}

export interface Pullable {
  pull(query: Query): Promise<Transform[]>;
}

/**
  Mixes the `Pullable` interface into a source.

  The `Pullable` interface adds a single method to a Source: `pull`. This
  method accepts a `Query` instance as an argument and returns a promise
  that resolves to an array of `Transform` instances that represent the
  changeset that resulted from applying the query. In other words, a `pull`
  request retrieves the results of a query in `Transform` form.

  This interface is part of the "request flow" in Orbit. Requests trigger
  events before and after processing of each request. Observers can delay the
  resolution of a request by returning a promise in an event listener.

  The `Pullable` interface introduces the following events:

  * `beforePull` - emitted prior to the processing of `pull`, this event
    includes the requested `Query` as an argument.

  * `pull` - emitted after a `pull` has successfully been requested, this
    event's arguments include both the requested `Query` and an array of
    the resulting `Transform` instances.

  * `pullFail` - emitted when an error has occurred processing a `pull`, this
    event's arguments include both the requested `Query` and the error.

  A `Pullable` source must implement a private method `_pull`, which performs
  the processing required for `pull` and returns a promise that resolves to an
  array of `Transform` instances.

  @function pullable
  @param {Object} source - Source class to decorate
  */
export default function pullable(Klass: any): void {
  let proto = Klass.prototype;

  if (isPullable(proto)) {
    return;
  }

  assert('Pullable interface can only be applied to a Source', proto instanceof Source);

  proto[PULLABLE] = true;

  proto.pull = function(query: Query): Promise<Transform[]> {
    return this._enqueueRequest('pull', query);
  }

  proto.__pull__ = function(query: Query): Promise<Transform[]> {
    return fulfillInSeries(this, 'beforePull', query)
      .then(() => this._pull(query))
      .then(result => this._transformed(result))
      .then(result => {
        return settleInSeries(this, 'pull', query, result)
          .then(() => result);
      })
      .catch(error => {
        return settleInSeries(this, 'pullFail', query, error)
          .then(() => { throw error; });
      });
  }
}
