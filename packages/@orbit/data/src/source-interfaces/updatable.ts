import Orbit, { settleInSeries, fulfillInSeries } from '@orbit/core';
import { Source, SourceClass } from '../source';
import { Transform, TransformOrOperations, buildTransform } from '../transform';

const { assert } = Orbit;

export const UPDATABLE = '__updatable__';

/**
 * Has a source been decorated as `@updatable`?
 */
export function isUpdatable(source: any) {
  return !!source[UPDATABLE];
}

/**
 * A source decorated as `@updatable` must also implement the `Updatable`
 * interface.
 */
export interface Updatable {
  /**
   * The `update` method accepts a `Transform` instance or an array of
   * operations which it then converts to a `Transform` instance. The source
   * applies the update and returns a promise that resolves when complete.
   */
  update(
    transformOrOperations: TransformOrOperations,
    options?: object,
    id?: string
  ): Promise<any>;

  _update(transform: Transform, hints?: any): Promise<any>;
}

/**
 * Marks a source as "updatable" and adds an implementation of the `Updatable`
 * interface.
 *
 * The `update` method is part of the "request flow" in Orbit. Requests trigger
 * events before and after processing of each request. Observers can delay the
 * resolution of a request by returning a promise in an event listener.
 *
 * An updatable source emits the following events:
 *
 * - `beforeUpdate` - emitted prior to the processing of `update`, this event
 * includes the requested `Transform` as an argument.
 *
 * - `update` - emitted after an `update` has successfully been applied, this
 * event includes the requested `Transform` as an argument.
 *
 * - `updateFail` - emitted when an error has occurred applying an update, this
 * event's arguments include both the requested `Transform` and the error.
 *
 * An updatable source must implement a private method `_update`, which performs
 * the processing required for `update` and returns a promise that resolves when
 * complete.
 */
export default function updatable(Klass: SourceClass): void {
  let proto = Klass.prototype;

  if (isUpdatable(proto)) {
    return;
  }

  assert(
    'Updatable interface can only be applied to a Source',
    proto instanceof Source
  );

  proto[UPDATABLE] = true;

  proto.update = async function(
    transformOrOperations: TransformOrOperations,
    options?: object,
    id?: string
  ): Promise<any> {
    await this.activated;
    const transform = buildTransform(
      transformOrOperations,
      options,
      id,
      this.transformBuilder
    );

    if (this.transformLog.contains(transform.id)) {
      return Promise.resolve();
    }

    return this._enqueueRequest('update', transform);
  };

  proto.__update__ = async function(transform: Transform): Promise<any> {
    if (this.transformLog.contains(transform.id)) {
      return;
    }

    try {
      const hints: any = {};
      await fulfillInSeries(this, 'beforeUpdate', transform, hints);
      let result = await this._update(transform, hints);
      await settleInSeries(this, 'update', transform, result);
      return result;
    } catch (error) {
      await settleInSeries(this, 'updateFail', transform, error);
      throw error;
    }
  };
}
