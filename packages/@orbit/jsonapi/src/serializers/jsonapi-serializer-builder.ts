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
  SerializerClass
} from '@orbit/serializers';
import { JSONAPIAtomicOperationSerializer } from './jsonapi-atomic-operation-serializer';
import { JSONAPIResourceSerializer } from './jsonapi-resource-serializer';
import { JSONAPIResourceIdentitySerializer } from './jsonapi-resource-identity-serializer';
import { RecordSchema, RecordKeyMap } from '@orbit/records';
import { JSONAPISerializers } from './jsonapi-serializers';
import { JSONAPIDocumentSerializer } from './jsonapi-document-serializer';
import { JSONAPIResourceFieldSerializer } from './jsonapi-resource-field-serializer';

export function buildJSONAPISerializerFor(settings: {
  schema: RecordSchema;
  keyMap?: RecordKeyMap;
  serializerFor?: SerializerForFn;
  serializerClassFor?: SerializerClassForFn;
  serializerSettingsFor?: SerializerSettingsForFn;
}): SerializerForFn {
  const { schema, keyMap } = settings;

  const defaultSerializerClassFor = buildSerializerClassFor({
    unknown: NoopSerializer,
    object: NoopSerializer,
    array: NoopSerializer,
    boolean: BooleanSerializer as SerializerClass,
    string: StringSerializer as SerializerClass,
    date: DateSerializer as SerializerClass,
    datetime: DateTimeSerializer as SerializerClass,
    number: NumberSerializer as SerializerClass,
    [JSONAPISerializers.Resource as string]: JSONAPIResourceSerializer as SerializerClass,
    [JSONAPISerializers.ResourceDocument as string]: JSONAPIDocumentSerializer as SerializerClass,
    [JSONAPISerializers.ResourceIdentity as string]: JSONAPIResourceIdentitySerializer as SerializerClass,
    [JSONAPISerializers.ResourceAtomicOperation as string]: JSONAPIAtomicOperationSerializer as SerializerClass,
    [JSONAPISerializers.ResourceType as string]: StringSerializer as SerializerClass,
    [JSONAPISerializers.ResourceTypeParam as string]: StringSerializer as SerializerClass,
    [JSONAPISerializers.ResourceTypePath as string]: StringSerializer as SerializerClass,
    [JSONAPISerializers.ResourceField as string]: JSONAPIResourceFieldSerializer as SerializerClass,
    [JSONAPISerializers.ResourceFieldParam as string]: JSONAPIResourceFieldSerializer as SerializerClass,
    [JSONAPISerializers.ResourceFieldPath as string]: JSONAPIResourceFieldSerializer as SerializerClass
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
