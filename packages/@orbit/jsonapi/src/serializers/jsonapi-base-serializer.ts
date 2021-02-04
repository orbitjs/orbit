import { RecordSchema, RecordKeyMap } from '@orbit/records';
import {
  BaseSerializer,
  SerializerForFn,
  StringSerializer
} from '@orbit/serializers';
import { JSONAPIResourceIdentitySerializer } from './jsonapi-resource-identity-serializer';
import { JSONAPIResourceSerializer } from './jsonapi-resource-serializer';
import { JSONAPISerializers } from './jsonapi-serializers';
import { JSONAPIAtomicOperationSerializer } from './jsonapi-atomic-operation-serializer';
import { JSONAPIResourceFieldSerializer } from './jsonapi-resource-field-serializer';
import { JSONAPIAtomicOperationsDocumentSerializer } from './jsonapi-atomic-operations-document-serializer';
import { JSONAPIAtomicResultsDocumentSerializer } from './jsonapi-atomic-results-document-serializer';
import { JSONAPIDocumentSerializer } from './jsonapi-document-serializer';

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
  protected _schema: RecordSchema;
  protected _keyMap?: RecordKeyMap;

  constructor(settings: {
    serializerFor: SerializerForFn;
    serializationOptions?: SerializationOptions;
    deserializationOptions?: DeserializationOptions;
    schema: RecordSchema;
    keyMap?: RecordKeyMap;
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

  get schema(): RecordSchema {
    return this._schema;
  }

  get keyMap(): RecordKeyMap | undefined {
    return this._keyMap;
  }

  protected get resourceSerializer(): JSONAPIResourceSerializer {
    return this.serializerFor(
      JSONAPISerializers.Resource
    ) as JSONAPIResourceSerializer;
  }

  protected get documentSerializer(): JSONAPIDocumentSerializer {
    return this.serializerFor(
      JSONAPISerializers.ResourceDocument
    ) as JSONAPIDocumentSerializer;
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

  protected get atomicOperationSerializer(): JSONAPIAtomicOperationSerializer {
    return this.serializerFor(
      JSONAPISerializers.ResourceAtomicOperation
    ) as JSONAPIAtomicOperationSerializer;
  }

  protected get atomicOperationsDocumentSerializer(): JSONAPIAtomicOperationsDocumentSerializer {
    return this.serializerFor(
      JSONAPISerializers.ResourceAtomicOperationsDocument
    ) as JSONAPIAtomicOperationsDocumentSerializer;
  }

  protected get atomicResultsDocumentSerializer(): JSONAPIAtomicResultsDocumentSerializer {
    return this.serializerFor(
      JSONAPISerializers.ResourceAtomicResultsDocument
    ) as JSONAPIAtomicResultsDocumentSerializer;
  }
}
