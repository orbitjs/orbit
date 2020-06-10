import { UnknownSerializer, UnknownSerializerClass } from './serializer';
import { Dict } from '@orbit/utils';

export type SerializerForFn = (type: string) => UnknownSerializer | undefined;

export function buildSerializerFor(settings: {
  serializers?: Dict<UnknownSerializer>;
  serializerClassFor?: SerializerClassForFn;
  serializerSettingsFor?: SerializerSettingsForFn;
}): SerializerForFn {
  const customSerializers = settings.serializers || {};
  const serializers = {
    ...customSerializers
  };
  const serializerClassFor = settings.serializerClassFor;
  const serializerSettingsFor = settings.serializerSettingsFor;

  function serializerFor(type: string): UnknownSerializer | undefined {
    return serializers[type] || createSerializer(type);
  }

  function createSerializer(type: string): UnknownSerializer | undefined {
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

export type SerializerClassForFn = (type: string) => UnknownSerializerClass;

export function buildSerializerClassFor(
  serializerClasses: Dict<UnknownSerializerClass> = {}
): SerializerClassForFn {
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
