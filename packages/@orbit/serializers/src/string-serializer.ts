import { Serializer } from './serializer';
import Orbit from '@orbit/core';

const { deprecate } = Orbit;

/**
 * @deprecated until v0.18
 */
export class StringSerializer implements Serializer<string, string> {
  constructor() {
    deprecate('StringSerializer is deprecated. Use NoopSerializer instead.');
  }

  serialize(arg: string): string {
    return arg;
  }

  deserialize(arg: string): string {
    return arg;
  }
}
