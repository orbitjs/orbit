import { Serializer } from './serializer';

export class NumberSerializer implements Serializer<number, number> {
  serialize(arg: number): number {
    return arg;
  }

  deserialize(arg: number): number {
    return arg;
  }
}
