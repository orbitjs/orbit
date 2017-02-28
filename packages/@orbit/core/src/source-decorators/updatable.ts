import Orbit from '../main';
import { assert } from '@orbit/utils';
import { settleInSeries, fulfillInSeries } from '../evented';
import { Operation } from '../operation';
import Transform, { TransformOrOperations } from '../transform';
import Source from '../source';

export const UPDATABLE = '__updatable__';

export function isUpdatable(obj: any) {
  return !!obj[UPDATABLE];
}

export interface Updatable {
  update(transformOrOperations: TransformOrOperations): Promise<void>;
}

/**
 Mixes the `Updatable` interface into a source.

  The `Updatable` interface adds a single method to a source: `update`. This
  method accepts a `Transform` instance or an array of operations which it then
  converts to a `Transform` instance. The source applies the update and returns
  a promise that resolves when complete.

  This interface is part of the "request flow" in Orbit. Requests trigger
  events before and after processing of each request. Observers can delay the
  resolution of a request by returning a promise in an event listener.

  The `Updatable` interface introduces the following events:

  * `beforeUpdate` - emitted prior to the processing of `update`, this event
    includes the requested `Transform` as an argument.

  * `update` - emitted after an `update` has successfully been applied, this
    event includes the requested `Transform` as an argument.

  * `updateFail` - emitted when an error has occurred applying an update, this
    event's arguments include both the requested `Transform` and the error.

  An `Updatable` source must implement a private method `_update`, which
  performs the processing required for `update` and returns a promise that
  resolves when complete.

  @function updatable
  @param {Object} source - Source to decorate
  */
export default function updatable(Klass: any): void {
  let proto = Klass.prototype;

  if (isUpdatable(proto)) {
    return;
  }

  assert('Updatable interface can only be applied to a Source', proto instanceof Source);

  proto[UPDATABLE] = true;

  proto.update = function(transformOrOperations: TransformOrOperations): Promise<void> {
    const transform = Transform.from(transformOrOperations);

    if (this.transformLog.contains(transform.id)) {
      return Orbit.Promise.resolve([]);
    }

    return this._enqueueRequest('update', transform);
  }

  proto.__update__ = function(transform: Transform): Promise<void> {
    if (this.transformLog.contains(transform.id)) {
      return Orbit.Promise.resolve([]);
    }

    return fulfillInSeries(this, 'beforeUpdate', transform)
      .then(() => this._update(transform))
      .then(() => this._transformed([transform]))
      .then(() => settleInSeries(this, 'update', transform))
      .catch(error => {
        return settleInSeries(this, 'updateFail', transform, error)
          .then(() => { throw error; });
      });
  }
}
