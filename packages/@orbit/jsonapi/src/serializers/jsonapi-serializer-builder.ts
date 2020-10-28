import { deepMerge } from '@orbit/utils';
import {
  NoopSerializer,
  BooleanSerializer,
  StringSerializer,
  DateSerializer,
  DateTimeSerializer,
  NumberSerializer,
  buildSerializerFor,
  buildSerializerClassFor,
  buildSerializerSettingsFor,
  SerializerForFn,
  SerializerClassForFn,
  SerializerSettingsForFn,
  UnknownSerializerClass
} from '@orbit/serializers';
import { JSONAPIAtomicOperationSerializer } from './jsonapi-atomic-operation-serializer';
import { JSONAPIResourceSerializer } from './jsonapi-resource-serializer';
import { JSONAPIResourceIdentitySerializer } from './jsonapi-resource-identity-serializer';
import { Schema, KeyMap } from '@orbit/data';
import { JSONAPISerializers } from './jsonapi-serializers';
import { JSONAPIDocumentSerializer } from './jsonapi-document-serializer';
import { JSONAPIResourceFieldSerializer } from './jsonapi-resource-field-serializer';

export function buildJSONAPISerializerFor(settings: {
  schema: Schema;
  keyMap?: KeyMap;
  serializerFor?: SerializerForFn;
  serializerClassFor?: SerializerClassForFn;
  serializerSettingsFor?: SerializerSettingsForFn;
}): SerializerForFn {
  const { schema, keyMap } = settings;

  const defaultSerializerClassFor = buildSerializerClassFor({
    unknown: NoopSerializer,
    object: NoopSerializer,
    array: NoopSerializer,
    boolean: BooleanSerializer as UnknownSerializerClass,
    string: StringSerializer as UnknownSerializerClass,
    date: DateSerializer as UnknownSerializerClass,
    datetime: DateTimeSerializer as UnknownSerializerClass,
    number: NumberSerializer as UnknownSerializerClass,
    [JSONAPISerializers.Resource as string]: JSONAPIResourceSerializer as UnknownSerializerClass,
    [JSONAPISerializers.ResourceDocument as string]: JSONAPIDocumentSerializer as UnknownSerializerClass,
    [JSONAPISerializers.ResourceIdentity as string]: JSONAPIResourceIdentitySerializer as UnknownSerializerClass,
    [JSONAPISerializers.ResourceAtomicOperation as string]: JSONAPIAtomicOperationSerializer as UnknownSerializerClass,
    [JSONAPISerializers.ResourceType as string]: StringSerializer as UnknownSerializerClass,
    [JSONAPISerializers.ResourceTypePath as string]: StringSerializer as UnknownSerializerClass,
    [JSONAPISerializers.ResourceField as string]: JSONAPIResourceFieldSerializer as UnknownSerializerClass,
    [JSONAPISerializers.ResourceFieldParam as string]: JSONAPIResourceFieldSerializer as UnknownSerializerClass,
    [JSONAPISerializers.ResourceFieldPath as string]: JSONAPIResourceFieldSerializer as UnknownSerializerClass
  });
  let serializerClassFor: SerializerClassForFn;
  if (settings.serializerClassFor) {
    serializerClassFor = (type = 'unknown') => {
      return (
        (settings.serializerClassFor as SerializerClassForFn)(type) ||
        defaultSerializerClassFor(type)
      );
    };
  } else {
    serializerClassFor = defaultSerializerClassFor;
  }

  let serializerSettingsFor: SerializerSettingsForFn;
  let defaultSerializerSettingsFor = buildSerializerSettingsFor({
    sharedSettings: {
      keyMap,
      schema
    },
    settingsByType: {
      [JSONAPISerializers.ResourceTypePath]: {
        serializationOptions: { inflectors: ['pluralize', 'dasherize'] }
      },
      [JSONAPISerializers.ResourceFieldPath]: {
        serializationOptions: { inflectors: ['dasherize'] }
      }
    }
  });
  let customSerializerSettingsFor = settings.serializerSettingsFor;
  if (customSerializerSettingsFor) {
    serializerSettingsFor = (type = 'unknown') => {
      let defaultSerializerSettings = defaultSerializerSettingsFor(type) || {};
      let customSerializerSettings =
        (customSerializerSettingsFor as SerializerSettingsForFn)(type) || {};
      return deepMerge(defaultSerializerSettings, customSerializerSettings);
    };
  } else {
    serializerSettingsFor = defaultSerializerSettingsFor;
  }

  let customSerializerFor = settings.serializerFor;
  let backupSerializerFor = buildSerializerFor({
    serializerClassFor,
    serializerSettingsFor
  });
  if (customSerializerFor) {
    return (type = 'unknown') =>
      (customSerializerFor as SerializerForFn)(type) ||
      backupSerializerFor(type);
  } else {
    return (type = 'unknown') => backupSerializerFor(type);
  }
}
