import { Serializer } from './serializer';
import { dasherize, camelize } from '@orbit/utils';

export class DasherizedStringSerializer implements Serializer<string, string> {
  serialize(arg: string): string {
    return dasherize(arg);
  }

  deserialize(arg: string): string {
    return camelize(arg);
  }
}
