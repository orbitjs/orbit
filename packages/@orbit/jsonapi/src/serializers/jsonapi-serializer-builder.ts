import { deepMerge } from '@orbit/utils';
import {
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
  SerializerSettingsForFn
} from '@orbit/serializers';
import { JSONAPIOperationSerializer } from './jsonapi-operation-serializer';
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
    boolean: BooleanSerializer,
    string: StringSerializer,
    date: DateSerializer,
    datetime: DateTimeSerializer,
    number: NumberSerializer,
    [JSONAPISerializers.Resource]: JSONAPIResourceSerializer,
    [JSONAPISerializers.ResourceDocument]: JSONAPIDocumentSerializer,
    [JSONAPISerializers.ResourceIdentity]: JSONAPIResourceIdentitySerializer,
    [JSONAPISerializers.ResourceOperation]: JSONAPIOperationSerializer,
    [JSONAPISerializers.ResourceType]: StringSerializer,
    [JSONAPISerializers.ResourceTypePath]: StringSerializer,
    [JSONAPISerializers.ResourceField]: JSONAPIResourceFieldSerializer,
    [JSONAPISerializers.ResourceFieldParam]: JSONAPIResourceFieldSerializer,
    [JSONAPISerializers.ResourceFieldPath]: JSONAPIResourceFieldSerializer
  });
  let serializerClassFor: SerializerClassForFn;
  if (settings.serializerClassFor) {
    serializerClassFor = (type: string) => {
      return (
        settings.serializerClassFor(type) || defaultSerializerClassFor(type)
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
    serializerSettingsFor = (type: string) => {
      let defaultSerializerSettings = defaultSerializerSettingsFor(type) || {};
      let customSerializerSettings = customSerializerSettingsFor(type) || {};
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
    return (type: string) =>
      customSerializerFor(type) || backupSerializerFor(type);
  } else {
    return (type: string) => backupSerializerFor(type);
  }
}
