import { Schema, KeyMap } from '@orbit/data';
import {
  BaseSerializer,
  SerializerForFn,
  StringSerializer
} from '@orbit/serializers';
import { JSONAPIResourceIdentitySerializer } from './jsonapi-resource-identity-serializer';
import { JSONAPIResourceSerializer } from './jsonapi-resource-serializer';
import { JSONAPISerializers } from './jsonapi-serializers';
import { JSONAPIOperationSerializer } from './jsonapi-operation-serializer';
import { JSONAPIResourceFieldSerializer } from './jsonapi-resource-field-serializer';

export abstract class JSONAPIBaseSerializer<
  From,
  To,
  SerializationOptions,
  DeserializationOptions
> extends BaseSerializer<
  From,
  To,
  SerializationOptions,
  DeserializationOptions
> {
  serializerFor!: SerializerForFn;
  protected _schema: Schema;
  protected _keyMap?: KeyMap;

  constructor(settings: {
    serializerFor: SerializerForFn;
    serializationOptions?: SerializationOptions;
    deserializationOptions?: DeserializationOptions;
    schema: Schema;
    keyMap?: KeyMap;
  }) {
    const {
      serializerFor,
      serializationOptions,
      deserializationOptions,
      schema,
      keyMap
    } = settings;
    super({
      serializerFor,
      serializationOptions,
      deserializationOptions
    });
    this._schema = schema;
    this._keyMap = keyMap;
  }

  get schema(): Schema {
    return this._schema;
  }

  get keyMap(): KeyMap | undefined {
    return this._keyMap;
  }

  protected get resourceSerializer(): JSONAPIResourceSerializer {
    return this.serializerFor(
      JSONAPISerializers.Resource
    ) as JSONAPIResourceSerializer;
  }

  protected get identitySerializer(): JSONAPIResourceIdentitySerializer {
    return this.serializerFor(
      JSONAPISerializers.ResourceIdentity
    ) as JSONAPIResourceIdentitySerializer;
  }

  protected get typeSerializer(): StringSerializer {
    return this.serializerFor(
      JSONAPISerializers.ResourceType
    ) as StringSerializer;
  }

  protected get fieldSerializer(): JSONAPIResourceFieldSerializer {
    return this.serializerFor(
      JSONAPISerializers.ResourceField
    ) as JSONAPIResourceFieldSerializer;
  }

  protected get operationSerializer(): JSONAPIOperationSerializer {
    return this.serializerFor(
      JSONAPISerializers.ResourceOperation
    ) as JSONAPIOperationSerializer;
  }
}
