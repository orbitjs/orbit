import {
  StringSerializer,
  StringSerializationOptions
} from '@orbit/serializers';

export interface JSONAPIResourceFieldSerializationOptions
  extends StringSerializationOptions {
  type?: string;
}

export class JSONAPIResourceFieldSerializer extends StringSerializer {
  serialize(
    arg: string,
    customOptions?: JSONAPIResourceFieldSerializationOptions
  ): string {
    return super.serialize(arg, customOptions as StringSerializationOptions);
  }

  deserialize(
    arg: string,
    customOptions?: JSONAPIResourceFieldSerializationOptions
  ): string {
    return super.deserialize(arg, customOptions as StringSerializationOptions);
  }
}
