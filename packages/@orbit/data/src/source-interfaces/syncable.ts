import { isArray } from '@orbit/utils';
import Orbit, { fulfillInSeries, settleInSeries } from '@orbit/core';
import { Source, SourceClass } from '../source';
import { Transform } from '../transform';

const { assert } = Orbit;

export const SYNCABLE = '__syncable__';

/**
 * Has a source been decorated as `@syncable`?
 */
export function isSyncable(source: any) {
  return !!source[SYNCABLE];
}

/**
 * A source decorated as `@syncable` must also implement the `Syncable`
 * interface.
 */
export interface Syncable {
  /**
   * The `sync` method to a source. This method accepts a `Transform` or array
   * of `Transform`s as an argument and applies it to the source.
   */
  sync(transformOrTransforms: Transform | Transform[]): Promise<void>;

  _sync(transform: Transform): Promise<void>;
}

/**
 * Marks a source as "syncable" and adds an implementation of the `Syncable`
 * interface.
 *
 * The `sync` method is part of the "sync flow" in Orbit. This flow is used to
 * synchronize the contents of sources.
 *
 * Other sources can participate in the resolution of a `sync` by observing the
 * `transform` event, which is emitted whenever a new `Transform` is applied to
 * a source.
 */
export default function syncable(Klass: SourceClass): void {
  let proto = Klass.prototype;

  if (isSyncable(proto)) {
    return;
  }

  assert('Syncable interface can only be applied to a Source', proto instanceof Source);

  proto[SYNCABLE] = true;

  proto.sync = function(transformOrTransforms: Transform | Transform[]): Promise<void> {
    if (isArray(transformOrTransforms)) {
      const transforms = <Transform[]>transformOrTransforms;

      return transforms.reduce((chain, transform) => {
        return chain.then(() => this.sync(transform));
      }, Promise.resolve());
    } else {
      const transform = <Transform>transformOrTransforms;

      if (this.transformLog.contains(transform.id)) {
        return Promise.resolve();
      }

      return this._enqueueSync('sync', transform);
    }
  }

  proto.__sync__ = function(transform: Transform): Promise<void> {
    if (this.transformLog.contains(transform.id)) {
      return Promise.resolve();
    }

    return fulfillInSeries(this, 'beforeSync', transform)
      .then(() => {
        if (this.transformLog.contains(transform.id)) {
          return Promise.resolve();
        } else {
          return this._sync(transform)
            .then(() => this._transformed([transform]))
            .then(() => settleInSeries(this, 'sync', transform));
        }
      })
      .catch((error: Error) => {
        return settleInSeries(this, 'syncFail', transform, error)
          .then(() => { throw error; });
      });
  }
}
