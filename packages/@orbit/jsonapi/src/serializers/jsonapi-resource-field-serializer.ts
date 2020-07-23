import { Schema, KeyMap } from '@orbit/data';
import {
  SerializerForFn,
  StringSerializer,
  StringSerializationOptions
} from '@orbit/serializers';

export interface JSONAPIResourceFieldSerializationOptions
  extends StringSerializationOptions {
  type: string;
}

export class JSONAPIResourceFieldSerializer extends StringSerializer {
  serializerFor: SerializerForFn;
  protected _schema: Schema;
  protected _keyMap: KeyMap;

  serialize(
    arg: string | null,
    customOptions?: JSONAPIResourceFieldSerializationOptions
  ): string | null {
    return super.serialize(arg, customOptions as StringSerializationOptions);
  }

  deserialize(
    arg: string | null,
    customOptions?: JSONAPIResourceFieldSerializationOptions
  ): string | null {
    return super.deserialize(arg, customOptions as StringSerializationOptions);
  }
}
