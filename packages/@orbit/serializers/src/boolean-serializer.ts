import { Serializer } from './serializer';

export class BooleanSerializer implements Serializer<boolean, boolean> {
  serialize(arg: boolean): boolean {
    return arg;
  }

  deserialize(arg: boolean): boolean {
    return arg;
  }
}
