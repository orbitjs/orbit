import { BaseSerializer, BaseSerializationOptions } from './base-serializer';
import { dasherize, camelize, underscore } from '@orbit/utils';

export type StringTransformFn = (arg: string) => string;
export type StringTransformConst =
  | 'camelize'
  | 'dasherize'
  | 'underscore'
  | 'pluralize'
  | 'singularize';
export type StringTransform = StringTransformFn | StringTransformConst;

export interface StringSerializationOptions extends BaseSerializationOptions {
  transforms?: StringTransform[];
}

export interface StringSerializerSettings {
  serializationOptions?: StringSerializationOptions;
  deserializationOptions?: StringSerializationOptions;
  pluralizeFn?: StringTransformFn;
  singularizeFn?: StringTransformFn;
}

export class StringSerializer extends BaseSerializer<
  string | null,
  string | null,
  StringSerializationOptions,
  StringSerializationOptions
> {
  protected pluralizeFn?: StringTransformFn;
  protected singularizeFn?: StringTransformFn;

  constructor(settings?: StringSerializerSettings) {
    super(settings);
    this.pluralizeFn = settings?.pluralizeFn;
    this.singularizeFn = settings?.singularizeFn;

    if (
      this.serializationOptions &&
      this.deserializationOptions === undefined
    ) {
      const { disallowNull, transforms } = this.serializationOptions;
      this.deserializationOptions = {
        disallowNull,
        transforms: this.buildInverseTransforms(transforms)
      };
    }
  }

  serialize(
    arg: string | null,
    customOptions?: StringSerializationOptions
  ): string | null {
    const options = this.buildSerializationOptions(customOptions);

    if (arg === null) {
      if (options.disallowNull) {
        throw new Error('null values are not allowed');
      }
      return null;
    }

    const { transforms } = options;
    let result = arg;

    if (transforms) {
      for (let transform of transforms) {
        result = this.applyTransform(transform, result);
      }
    }

    return result;
  }

  deserialize(
    arg: string | null,
    customOptions?: StringSerializationOptions
  ): string | null {
    const options = this.buildDeserializationOptions(customOptions);

    if (arg === null) {
      if (options.disallowNull) {
        throw new Error('null values are not allowed');
      }
      return null;
    }

    const { transforms } = options;
    let result = arg;

    if (transforms) {
      for (let transform of transforms) {
        result = this.applyTransform(transform, result);
      }
    }

    return result;
  }

  protected buildInverseTransforms(
    transforms?: StringTransform[]
  ): StringTransform[] | undefined {
    if (transforms) {
      const inverseTransforms: StringTransformConst[] = [];

      for (let transform of transforms) {
        let inverseTransform;
        if (typeof transform === 'string') {
          inverseTransform = this.inverseTransformConst(transform);
        }
        if (inverseTransform) {
          inverseTransforms.unshift(inverseTransform as StringTransformConst);
        } else {
          return;
        }
      }

      return inverseTransforms;
    }
  }

  protected applyTransform(transform: StringTransform, arg: string): string {
    if (typeof transform === 'function') {
      return transform(arg);
    } else {
      switch (transform) {
        case 'pluralize':
          return this.pluralize(arg);
        case 'singularize':
          return this.singularize(arg);
        case 'dasherize':
          return dasherize(arg);
        case 'underscore':
          return underscore(arg);
        case 'camelize':
          return camelize(arg);
        default:
          throw new Error(
            `'StringSerializer does not recognize transform '${transform}'`
          );
      }
    }
  }

  protected inverseTransformConst(
    transform: StringTransformConst
  ): StringTransformConst | null {
    switch (transform) {
      case 'pluralize':
        return 'singularize';
      case 'singularize':
        return 'pluralize';
      case 'dasherize':
        return 'camelize';
      case 'underscore':
        return 'camelize';
      case 'camelize': // There's no rational inverse for camelization
      default:
        return null;
    }
  }

  protected pluralize(arg: string): string {
    if (this.pluralizeFn) {
      return this.pluralizeFn(arg);
    } else {
      throw new Error(
        "StringSerializer must be passed a 'pluralizeFn' in order to pluralize a string"
      );
    }
  }

  protected singularize(arg: string): string {
    if (this.singularizeFn) {
      return this.singularizeFn(arg);
    } else {
      throw new Error(
        "StringSerializer must be passed a 'singularizeFn' in order to singularize a string"
      );
    }
  }
}
