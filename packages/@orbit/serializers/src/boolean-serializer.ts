import { Serializer } from './serializer';
import Orbit from '@orbit/core';

const { deprecate } = Orbit;

/**
 * @deprecated until v0.18
 */
export class BooleanSerializer implements Serializer<boolean, boolean> {
  constructor() {
    deprecate('BooleanSerializer is deprecated. Use NoopSerializer instead.');
  }

  serialize(arg: boolean): boolean {
    return arg;
  }

  deserialize(arg: boolean): boolean {
    return arg;
  }
}
