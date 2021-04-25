import { BaseSerializer } from './base-serializer';

export class NumberSerializer extends BaseSerializer<number, number> {
  serialize(arg: number): number {
    return arg;
  }

  deserialize(arg: number): number {
    return arg;
  }
}
