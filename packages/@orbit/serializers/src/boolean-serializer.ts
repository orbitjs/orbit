import { BaseSerializer } from './base-serializer';

export class BooleanSerializer extends BaseSerializer<boolean, boolean> {
  serialize(arg: boolean): boolean {
    return arg ? true : false;
  }

  deserialize(arg: boolean): boolean {
    return arg ? true : false;
  }
}
