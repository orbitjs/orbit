import { BaseSerializer, BaseSerializationOptions } from './base-serializer';

export interface DateSerializerSettings {
  serializationOptions?: BaseSerializationOptions;
  deserializationOptions?: BaseSerializationOptions;
}

export class DateSerializer extends BaseSerializer<
  Date | null,
  string | null,
  BaseSerializationOptions,
  BaseSerializationOptions
> {
  constructor(settings?: DateSerializerSettings) {
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

    return `${arg.getFullYear()}-${arg.getMonth() + 1}-${arg.getDate()}`;
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

    const [year, month, date] = arg.split('-');
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(date));
  }
}
