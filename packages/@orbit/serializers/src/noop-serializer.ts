import { Serializer } from './serializer';

export class NoopSerializer
  implements Serializer<unknown, unknown, unknown, unknown> {
  serialize(arg: unknown): unknown {
    return arg;
  }

  deserialize(arg: unknown): unknown {
    return arg;
  }
}
