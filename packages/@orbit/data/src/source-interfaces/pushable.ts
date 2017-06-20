import Orbit from '../main';
import { assert } from '@orbit/utils';
import { settleInSeries, fulfillInSeries } from '@orbit/core';
import { Source, SourceClass } from '../source';
import Transform, { TransformOrOperations } from '../transform';
import TransformBuilder from '../transform-builder';

export const PUSHABLE = '__pushable__';

/**
 * Has a source been decorated as `@pushable`?
 *
 * @export
 * @param {Source} source
 * @returns
 */
export function isPushable(source: Source) {
  return !!source[PUSHABLE];
}

/**
 * A source decorated as `@pushable` must also implement the `Pushable`
 * interface.
 *
 * @export
 * @interface Pushable
 */
export interface Pushable {
  /**
   * The `push` method accepts a `Transform` instance as an argument and returns
   * a promise that resolves to an array of `Transform` instances that are
   * applied as a result. In other words, `push` captures the direct results
   * _and_ side effects of applying a `Transform` to a source.
   *
   * @param {TransformOrOperations} transformOrOperations
   * @param {object} [options]
   * @param {string} [id]
   * @returns {Promise<Transform[]>}
   *
   * @memberOf Pushable
   */
  push(transformOrOperations: TransformOrOperations, options?: object, id?: string): Promise<Transform[]>;

  _push(transform: Transform): Promise<Transform[]>;
}

/**
 * Marks a source as "pushable" and adds an implementation of the `Pushable`
 * interface.
 *
 * The `push` method is part of the "request flow" in Orbit. Requests trigger
 * events before and after processing of each request. Observers can delay the
 * resolution of a request by returning a promise in an event listener.
 *
 * A pushable source emits the following events:
 *
 * - `beforePush` - emitted prior to the processing of `push`, this event
 * includes the requested `Transform` as an argument.
 *
 * - `push` - emitted after a `push` has successfully been applied, this event's
 * arguments include both the requested `Transform` and an array of the actual
 * applied `Transform` instances.
 *
 * - `pushFail` - emitted when an error has occurred pushing a transform, this
 * event's arguments include both the requested `Transform` and the error.
 *
 * A pushable source must implement a private method `_push`, which performs
 * the processing required for `push` and returns a promise that resolves to an
 * array of `Transform` instances.
 *
 * @export
 * @decorator
 * @param {SourceClass} Klass
 * @returns {void}
 */
export default function pushable(Klass: SourceClass): void {
  let proto = Klass.prototype;

  if (isPushable(proto)) {
    return;
  }

  assert('Pushable interface can only be applied to a Source', proto instanceof Source);

  proto[PUSHABLE] = true;

  proto.push = function(transformOrOperations: TransformOrOperations, options?: object, id?: string): Promise<Transform[]> {
    let transformBuilder = this.transformBuilder;
    if (!transformBuilder) {
      transformBuilder = this.transformBuilder = new TransformBuilder();
    }
    const transform = Transform.from(transformOrOperations, options, id, transformBuilder);

    if (this.transformLog.contains(transform.id)) {
      return Orbit.Promise.resolve([]);
    }

    return this._enqueueRequest('push', transform);
  }

  proto.__push__ = function(transform: Transform): Promise<Transform[]> {
    if (this.transformLog.contains(transform.id)) {
      return Orbit.Promise.resolve([]);
    }

    return fulfillInSeries(this, 'beforePush', transform)
      .then(() => this._push(transform))
      .then(result => this._transformed(result))
      .then(result => {
        return settleInSeries(this, 'push', transform, result)
          .then(() => result);
      })
      .catch(error => {
        return settleInSeries(this, 'pushFail', transform, error)
          .then(() => { throw error; });
      });
  }
}
