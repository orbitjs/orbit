import { Orbit, fulfillInSeries, settleInSeries } from '@orbit/core';
import { Operation } from '../operation';
import { Source, SourceClass } from '../source';
import { buildTransform, Transform, TransformBuilderFunc } from '../transform';

const { assert } = Orbit;

const SYNCABLE = '__syncable__';

/**
 * Has a source been decorated as `@syncable`?
 */
export function isSyncable(source: Source): boolean {
  return !!(source as { [SYNCABLE]?: boolean })[SYNCABLE];
}

/**
 * A source decorated as `@syncable` must also implement the `Syncable`
 * interface.
 */

export interface Syncable<O extends Operation, TransformBuilder> {
  /**
   * The `sync` method to a source. This method accepts a `Transform` or array
   * of `Transform`s as an argument and applies it to the source.
   */
  sync(
    transformOrTransforms:
      | Transform<O>
      | Transform<O>[]
      | TransformBuilderFunc<O, TransformBuilder>
  ): Promise<void>;

  _sync(transform: Transform<O>): Promise<void>;
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
export function syncable(Klass: unknown): void {
  let proto = (Klass as SourceClass).prototype;

  if (isSyncable(proto)) {
    return;
  }

  assert(
    'Syncable interface can only be applied to a Source',
    proto instanceof Source
  );

  proto[SYNCABLE] = true;

  proto.sync = async function (
    transformOrTransforms:
      | Transform<Operation>
      | Transform<Operation>[]
      | TransformBuilderFunc<Operation, unknown>
  ): Promise<void> {
    await this.activated;

    if (Array.isArray(transformOrTransforms)) {
      const transforms = transformOrTransforms as Transform<Operation>[];

      for (let transform of transforms) {
        await this.sync(transform);
      }
    } else {
      let transform;

      if (typeof transformOrTransforms === 'function') {
        transform = buildTransform(
          transformOrTransforms,
          undefined,
          undefined,
          this.transformBuilder
        );
      } else {
        transform = transformOrTransforms as Transform<Operation>;

        if (this.transformLog.contains(transform.id)) {
          return;
        }
      }

      return this._syncQueue.push({
        type: 'sync',
        data: transform
      });
    }
  };

  proto.__sync__ = async function (
    transform: Transform<Operation>
  ): Promise<void> {
    if (this.transformLog.contains(transform.id)) {
      return;
    }

    try {
      await fulfillInSeries(this, 'beforeSync', transform);
      await this._sync(transform);
      await this.transformed([transform]);
      await settleInSeries(this, 'sync', transform);
    } catch (error) {
      await settleInSeries(this, 'syncFail', transform, error);
      throw error;
    }
  };
}
