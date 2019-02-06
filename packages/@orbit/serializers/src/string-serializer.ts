import { Serializer } from './serializer';

export class StringSerializer implements Serializer<string, string> {
  serialize(arg: string): string {
    return arg;
  }

  deserialize(arg: string): string {
    return arg;
  }
}
