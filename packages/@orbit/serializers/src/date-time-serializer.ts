import { BaseSerializer, BaseSerializationOptions } from './base-serializer';

export interface DateTimeSerializerSettings {
  serializationOptions?: BaseSerializationOptions;
  deserializationOptions?: BaseSerializationOptions;
}

export class DateTimeSerializer extends BaseSerializer<
  Date | null,
  string | null,
  BaseSerializationOptions,
  BaseSerializationOptions
> {
  constructor(settings?: DateTimeSerializerSettings) {
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
    arg: Date | null,
    customOptions?: BaseSerializationOptions
  ): string | null {
    const options = this.buildSerializationOptions(customOptions);

    if (arg === null) {
      if (options.disallowNull) {
        throw new Error('null values are not allowed');
      }
      return null;
    }

    return arg.toISOString();
  }

  deserialize(
    arg: string | null,
    customOptions?: BaseSerializationOptions
  ): Date | null {
    const options = this.buildDeserializationOptions(customOptions);

    if (arg === null) {
      if (options.disallowNull) {
        throw new Error('null values are not allowed');
      }
      return null;
    }

    let offset = arg.indexOf('+');
    if (offset !== -1 && arg.length - 5 === offset) {
      offset += 3;
      return new Date(arg.slice(0, offset) + ':' + arg.slice(offset));
    }
    return new Date(arg);
  }
}
