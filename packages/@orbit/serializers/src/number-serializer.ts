import { BaseSerializer, BaseSerializationOptions } from './base-serializer';

export interface NumberSerializerSettings {
  serializationOptions?: BaseSerializationOptions;
  deserializationOptions?: BaseSerializationOptions;
}

export class NumberSerializer extends BaseSerializer<
  number | null,
  number | null,
  BaseSerializationOptions,
  BaseSerializationOptions
> {
  constructor(settings?: NumberSerializerSettings) {
    super(settings);

    if (
      this.serializationOptions &&
      this.deserializationOptions === undefined
    ) {
      const { disallowNull } = this.serializationOptions;
      this.deserializationOptions = {
        disallowNull
      };
    }
  }

  serialize(
    arg: number | null,
    customOptions?: BaseSerializationOptions
  ): number | null {
    const options = this.buildSerializationOptions(customOptions);

    if (arg === null && options.disallowNull) {
      throw new Error('null values are not allowed');
    }

    return arg;
  }

  deserialize(
    arg: number | null,
    customOptions?: BaseSerializationOptions
  ): number | null {
    const options = this.buildDeserializationOptions(customOptions);

    if (arg === null && options.disallowNull) {
      throw new Error('null values are not allowed');
    }

    return arg;
  }
}
