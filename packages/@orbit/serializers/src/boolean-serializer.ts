import { BaseSerializer, BaseSerializationOptions } from './base-serializer';

export interface BooleanSerializerSettings {
  serializationOptions?: BaseSerializationOptions;
  deserializationOptions?: BaseSerializationOptions;
}

export class BooleanSerializer extends BaseSerializer<
  boolean | null,
  boolean | null,
  BaseSerializationOptions,
  BaseSerializationOptions
> {
  constructor(settings?: BooleanSerializerSettings) {
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
    arg: boolean | null,
    customOptions?: BaseSerializationOptions
  ): boolean | null {
    const options = this.buildSerializationOptions(customOptions);

    if (arg === null && options.disallowNull) {
      throw new Error('null values are not allowed');
    }

    return arg;
  }

  deserialize(
    arg: boolean | null,
    customOptions?: BaseSerializationOptions
  ): boolean | null {
    const options = this.buildDeserializationOptions(customOptions);

    if (arg === null && options.disallowNull) {
      throw new Error('null values are not allowed');
    }

    return arg;
  }
}
