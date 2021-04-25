import { Serializer } from './serializer';
import { SerializerForFn } from './serializer-builders';

export abstract class BaseSerializer<
  From,
  To,
  SerializationOptions = unknown,
  DeserializationOptions = unknown
> implements
    Serializer<From, To, SerializationOptions, DeserializationOptions> {
  serializerFor?: SerializerForFn;
  protected serializationOptions?: SerializationOptions;
  protected deserializationOptions?: DeserializationOptions;

  constructor(settings?: {
    serializerFor?: SerializerForFn;
    serializationOptions?: SerializationOptions;
    deserializationOptions?: DeserializationOptions;
  }) {
    this.serializerFor = settings?.serializerFor;
    this.serializationOptions = settings?.serializationOptions;
    this.deserializationOptions = settings?.deserializationOptions;
  }

  protected buildSerializationOptions(
    customOptions?: SerializationOptions
  ): SerializationOptions {
    let options = this.serializationOptions;
    if (options && customOptions) {
      return {
        ...options,
        ...customOptions
      };
    } else {
      return (options || customOptions || {}) as SerializationOptions;
    }
  }

  protected buildDeserializationOptions(
    customOptions?: DeserializationOptions
  ): DeserializationOptions {
    let options = this.deserializationOptions;
    if (options && customOptions) {
      return {
        ...options,
        ...customOptions
      };
    } else {
      return (options || customOptions || {}) as DeserializationOptions;
    }
  }

  abstract serialize(arg: From, options?: SerializationOptions): To;
  abstract deserialize(arg: To, options?: DeserializationOptions): From;
}
