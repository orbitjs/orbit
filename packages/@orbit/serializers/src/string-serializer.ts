import { Dict } from '@orbit/utils';
import { BaseSerializer } from './base-serializer';
import { Inflector } from './inflector';
import {
  standardInflectors,
  standardInverseInflectors,
  StandardInflectorName
} from './standard-inflectors';

export type InflectorOrName = Inflector | StandardInflectorName;

export interface StringSerializationOptions {
  inflectors?: InflectorOrName[];
}

export interface StringSerializerSettings {
  serializationOptions?: StringSerializationOptions;
  deserializationOptions?: StringSerializationOptions;
  inflectors?: Dict<Inflector>;
  inverseInflectors?: Dict<InflectorOrName>;
}

export class StringSerializer extends BaseSerializer<
  string,
  string,
  StringSerializationOptions,
  StringSerializationOptions
> {
  inflectors: Dict<Inflector>;
  inverseInflectors: Dict<InflectorOrName>;

  constructor(settings?: StringSerializerSettings) {
    super(settings);

    this.inflectors = settings?.inflectors || {};
    this.inverseInflectors = settings?.inverseInflectors || {};

    if (
      this.serializationOptions &&
      this.deserializationOptions === undefined
    ) {
      const { inflectors } = this.serializationOptions;
      this.deserializationOptions = {
        inflectors: this.buildInverseInflectors(inflectors)
      };
    }
  }

  serialize(arg: string, customOptions?: StringSerializationOptions): string {
    const options = this.buildSerializationOptions(customOptions);
    const { inflectors } = options;
    let result = arg;

    if (inflectors) {
      for (let inflector of inflectors) {
        result = this.applyInflector(inflector, result);
      }
    }

    return result;
  }

  deserialize(arg: string, customOptions?: StringSerializationOptions): string {
    const options = this.buildDeserializationOptions(customOptions);
    const { inflectors } = options;
    let result = arg;

    if (inflectors) {
      for (let inflector of inflectors) {
        result = this.applyInflector(inflector, result);
      }
    }

    return result;
  }

  protected buildInverseInflectors(
    inflectors?: InflectorOrName[]
  ): InflectorOrName[] | undefined {
    if (inflectors) {
      const inverseInflectors: StandardInflectorName[] = [];

      for (let inflector of inflectors) {
        let inverseInflector;
        if (typeof inflector === 'string') {
          inverseInflector =
            this.inverseInflectors[inflector] ||
            standardInverseInflectors[inflector];
        }
        if (inverseInflector) {
          inverseInflectors.unshift(inverseInflector as StandardInflectorName);
        } else {
          return;
        }
      }

      return inverseInflectors;
    }
  }

  protected applyInflector(
    inflectorOrName: InflectorOrName,
    arg: string
  ): string {
    let inflector: Inflector;

    if (typeof inflectorOrName === 'function') {
      inflector = inflectorOrName;
    } else {
      inflector =
        this.inflectors[inflectorOrName] ??
        standardInflectors[inflectorOrName as StandardInflectorName];

      if (!inflector) {
        throw new Error(
          `'StringSerializer does not recognize inflector '${inflectorOrName}'`
        );
      }
    }

    return inflector(arg);
  }
}
