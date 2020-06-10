import { Serializer } from './serializer';
import Orbit from '@orbit/core';

const { deprecate } = Orbit;

/**
 * @deprecated until v0.18
 */
export class NumberSerializer implements Serializer<number, number> {
  constructor() {
    deprecate('NumberSerializer is deprecated. Use NoopSerializer instead.');
  }

  serialize(arg: number): number {
    return arg;
  }

  deserialize(arg: number): number {
    return arg;
  }
}
