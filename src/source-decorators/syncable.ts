import Orbit from '../main';
import { assert } from '../utils/assert';
import { extend, isArray } from '../utils/objects';
import Source from '../source';
import Transform from '../transform';

export const SYNCABLE = '__syncable__';

export function isSyncable(obj: any) {
  return !!obj[SYNCABLE];  
}

export interface Syncable {
  sync(transformOrTransforms: Transform | Transform[]): Promise<void>;
}

/**
  Mixes the `Syncable` interface into a source.

  The `Syncable` interface adds the `sync` method to a source. This method
  accepts a `Transform` or array of `Transform`s as an argument and applies it
  to the source.

  This interface is part of the "sync flow" in Orbit. This flow is used to
  synchronize the contents of sources.

  Other sources can participate in the resolution of a `sync` by observing
  the `transform` event, which is emitted whenever a new `Transform` is
  applied to a source.

  @function sync
  @param {Object} source - Source to extend
  */
export default function syncable(Klass: any): void {
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
      }, Orbit.Promise.resolve());
    } else {
      const transform = <Transform>transformOrTransforms;

      if (this.transformLog.contains(transform.id)) {
        return Orbit.Promise.resolve();
      }

      return this._enqueueSync('sync', transform);
    }
  }

  proto.__sync__ = function(transform: Transform): Promise<void> {
    if (this.transformLog.contains(transform.id)) {
      return Orbit.Promise.resolve();
    }

    return this._sync(transform)
      .then(() => this._transformed([transform]));
  }
}
