import { Serializer } from './serializer';
import { underscore, camelize } from '@orbit/utils';

export class UnderscoredStringSerializer implements Serializer<string, string> {
  serialize(arg: string): string {
    return underscore(arg);
  }

  deserialize(arg: string): string {
    return camelize(arg);
  }
}
