import { Serializer, SerializerClass } from './serializer';
import { Dict } from '@orbit/utils';

export type SerializerForFn<S = Serializer> = (type: string) => S | undefined;

export function buildSerializerFor<S = Serializer>(settings: {
  serializers?: Dict<S>;
  serializerClassFor?: SerializerClassForFn<S>;
  serializerSettingsFor?: SerializerSettingsForFn;
}): SerializerForFn<S> {
  const customSerializers = settings.serializers ?? {};
  const serializers = {
    ...customSerializers
  };
  const serializerClassFor = settings.serializerClassFor;
  const serializerSettingsFor = settings.serializerSettingsFor;

  function serializerFor(type: string): S | undefined {
    return (serializers[type] as S) ?? createSerializer(type);
  }

  function createSerializer(type: string): S | undefined {
    const SerializerClass = serializerClassFor && serializerClassFor(type);
    if (SerializerClass) {
      const settings =
        (serializerSettingsFor && serializerSettingsFor(type)) || {};

      settings.serializerFor = serializerFor;

      return (serializers[type] = new SerializerClass(settings));
    }
  }

  return serializerFor;
}

export type SerializerClassForFn<S = Serializer> = (
  type: string
) => SerializerClass<S>;

export function buildSerializerClassFor<S = Serializer>(
  serializerClasses: Dict<SerializerClass<S>> = {}
): SerializerClassForFn<S> {
  return (type: string) => serializerClasses[type];
}

export type SerializerSettingsForFn = (
  type: string
) => Dict<unknown> | undefined;

export function buildSerializerSettingsFor(settings: {
  sharedSettings?: Dict<unknown>;
  settingsByType?: Dict<Dict<unknown>>;
}): SerializerSettingsForFn {
  const serializerSettings: Dict<Dict<unknown>> = {};
  const sharedSettings = settings.sharedSettings || {};
  const settingsByType = settings.settingsByType || {};

  function serializerSettingsFor(type: string): Dict<unknown> {
    return serializerSettings[type] || createSerializerSettings(type);
  }

  function createSerializerSettings(type: string): Dict<unknown> {
    const settingsForType = settingsByType[type] || {};
    const settings = {
      ...sharedSettings,
      ...settingsForType
    } as Dict<unknown>;

    return (serializerSettings[type] = settings);
  }

  return serializerSettingsFor;
}
