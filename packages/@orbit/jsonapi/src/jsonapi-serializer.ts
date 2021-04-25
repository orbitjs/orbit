import { deepSet, Dict } from '@orbit/utils';
import { Orbit, Assertion } from '@orbit/core';
import {
  RecordSchema,
  RecordKeyMap,
  InitializedRecord,
  RecordIdentity,
  RecordOperation,
  ModelDefinition
} from '@orbit/records';
import {
  Serializer,
  SerializerForFn,
  StringSerializer,
  buildSerializerSettingsFor
} from '@orbit/serializers';
import {
  Resource,
  ResourceDocument,
  ResourceIdentity,
  ResourceRelationship
} from './resource-document';
import {
  ResourceAtomicOperation,
  RecordOperationsDocument
} from './resource-operations';
import { ResourceAtomicOperationsDocument } from './resource-operations';
import { RecordDocument } from './record-document';
import { JSONAPIResourceSerializer } from './serializers/jsonapi-resource-serializer';
import { JSONAPIResourceIdentitySerializer } from './serializers/jsonapi-resource-identity-serializer';
import { buildJSONAPISerializerFor } from './serializers/jsonapi-serializer-builder';
import { JSONAPISerializers } from './serializers/jsonapi-serializers';
import { JSONAPIAtomicOperationSerializer } from './serializers/jsonapi-atomic-operation-serializer';
import { JSONAPIResourceFieldSerializer } from './serializers/jsonapi-resource-field-serializer';

const { deprecate } = Orbit;

export interface JSONAPISerializationOptions {
  primaryRecord?: InitializedRecord;
  primaryRecords?: InitializedRecord[];
}

export interface JSONAPISerializerSettings {
  schema: RecordSchema;
  keyMap?: RecordKeyMap;
  serializers?: Dict<Serializer>;
}

/**
 * @deprecated since v0.17, remove in v0.18
 */
export class JSONAPISerializer
  implements
    Serializer<
      RecordDocument,
      ResourceDocument,
      JSONAPISerializationOptions,
      JSONAPISerializationOptions
    > {
  protected _schema: RecordSchema;
  protected _keyMap?: RecordKeyMap;
  protected _serializerFor: SerializerForFn;

  constructor(settings: JSONAPISerializerSettings) {
    deprecate(
      "The 'JSONAPISerializer' class has deprecated. Use 'serializerFor' instead."
    );

    const { schema, keyMap, serializers } = settings;

    let serializerFor: SerializerForFn | undefined;
    if (serializers) {
      serializerFor = (type: string) => serializers[type];
    }
    const serializerSettingsFor = buildSerializerSettingsFor({
      settingsByType: {
        [JSONAPISerializers.ResourceField]: {
          serializationOptions: { inflectors: ['dasherize'] }
        },
        [JSONAPISerializers.ResourceType]: {
          serializationOptions: { inflectors: ['pluralize', 'dasherize'] }
        }
      }
    });

    this._schema = schema;
    this._keyMap = keyMap;
    this._serializerFor = buildJSONAPISerializerFor({
      schema,
      keyMap,
      serializerFor,
      serializerSettingsFor
    });
  }

  get schema(): RecordSchema {
    return this._schema;
  }

  get keyMap(): RecordKeyMap | undefined {
    return this._keyMap;
  }

  get serializerFor(): SerializerForFn {
    return this._serializerFor;
  }

  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  resourceKey(type: string): string {
    return 'id';
  }

  resourceType(type: string): string {
    return this.typeSerializer.serialize(type) as string;
  }

  resourceRelationship(type: string | undefined, relationship: string): string {
    return this.fieldSerializer.serialize(relationship, { type }) as string;
  }

  resourceAttribute(type: string | undefined, attr: string): string {
    return this.fieldSerializer.serialize(attr, { type }) as string;
  }

  resourceIdentity(identity: RecordIdentity): Resource {
    return {
      type: this.resourceType(identity.type),
      id: this.resourceId(identity.type, identity.id)
    };
  }

  resourceIds(type: string, ids: string[]): (string | undefined)[] {
    return ids.map((id) => this.resourceId(type, id));
  }

  resourceId(type: string, id: string): string | undefined {
    let resourceKey = this.resourceKey(type);

    if (resourceKey === 'id') {
      return id;
    } else if (this.keyMap) {
      return this.keyMap.idToKey(type, resourceKey, id);
    } else {
      throw new Assertion(
        `A keyMap is required to determine an id from the key '${resourceKey}'`
      );
    }
  }

  recordId(type: string, resourceId: string): string {
    let resourceKey = this.resourceKey(type);

    if (resourceKey === 'id') {
      return resourceId;
    }

    let existingId;
    if (this.keyMap) {
      existingId = this.keyMap.keyToId(type, resourceKey, resourceId);
      if (existingId) {
        return existingId;
      }
    } else {
      throw new Assertion(
        `A keyMap is required to determine an id from the key '${resourceKey}'`
      );
    }

    return this._generateNewId(type, resourceKey, resourceId);
  }

  recordType(resourceType: string): string {
    return this.typeSerializer.deserialize(resourceType) as string;
  }

  recordIdentity(resourceIdentity: ResourceIdentity): RecordIdentity {
    let type = this.recordType(resourceIdentity.type);
    let id = this.recordId(type, resourceIdentity.id);
    return { type, id };
  }

  recordAttribute(type: string, resourceAttribute: string): string {
    return this.fieldSerializer.deserialize(resourceAttribute) as string;
  }

  recordRelationship(type: string, resourceRelationship: string): string {
    return this.fieldSerializer.deserialize(resourceRelationship) as string;
  }

  serialize(document: RecordDocument): ResourceDocument {
    let data = document.data;

    return {
      data: Array.isArray(data)
        ? this.serializeRecords(data as InitializedRecord[])
        : this.serializeRecord(data as InitializedRecord)
    };
  }

  serializeAtomicOperationsDocument(
    document: RecordOperationsDocument
  ): ResourceAtomicOperationsDocument {
    return {
      'atomic:operations': this.serializeAtomicOperations(document.operations)
    };
  }

  serializeAtomicOperations(
    operations: RecordOperation[]
  ): ResourceAtomicOperation[] {
    return operations.map((operation) =>
      this.serializeAtomicOperation(operation)
    );
  }

  serializeAtomicOperation(
    operation: RecordOperation
  ): ResourceAtomicOperation {
    return this.atomicOperationSerializer.serialize(operation);
  }

  serializeRecords(records: InitializedRecord[]): Resource[] {
    return records.map((record) => this.serializeRecord(record));
  }

  serializeRecord(record: InitializedRecord): Resource {
    const resource: Resource = {
      type: this.resourceType(record.type)
    };
    const model: ModelDefinition = this._schema.getModel(record.type);

    this.serializeId(resource, record, model);
    this.serializeAttributes(resource, record, model);
    this.serializeRelationships(resource, record, model);

    return resource;
  }

  serializeIdentity(record: InitializedRecord): Resource {
    return {
      type: this.resourceType(record.type),
      id: this.resourceId(record.type, record.id)
    };
  }

  serializeId(
    resource: Resource,
    record: RecordIdentity,
    /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
    model: ModelDefinition
  ): void {
    let value = this.resourceId(record.type, record.id);
    if (value !== undefined) {
      resource.id = value;
    }
  }

  serializeAttributes(
    resource: Resource,
    record: InitializedRecord,
    model: ModelDefinition
  ): void {
    if (record.attributes) {
      Object.keys(record.attributes).forEach((attr) => {
        this.serializeAttribute(resource, record, attr, model);
      });
    }
  }

  serializeAttribute(
    resource: Resource,
    record: InitializedRecord,
    attr: string,
    model: ModelDefinition
  ): void {
    let value: any = record.attributes?.[attr];
    if (value === undefined) {
      return;
    }
    const attrOptions = model.attributes?.[attr];
    if (attrOptions === undefined) {
      return;
    }
    const serializer = this.serializerFor(attrOptions.type || 'unknown');
    if (serializer) {
      const serializationOptions =
        attrOptions.serialization ?? (attrOptions as any).serializationOptions;

      if ((attrOptions as any).serializationOptions !== undefined) {
        deprecate(
          `The attribute '${attr}' for '${record.type}' has been assigned \`serializationOptions\` in the schema. Use \`serialization\` instead.`
        );
      }

      value =
        value === null
          ? null
          : serializer.serialize(value, serializationOptions);
    }
    deepSet(
      resource,
      ['attributes', this.resourceAttribute(record.type, attr)],
      value
    );
  }

  serializeRelationships(
    resource: Resource,
    record: InitializedRecord,
    model: ModelDefinition
  ): void {
    if (record.relationships) {
      Object.keys(record.relationships).forEach((relationship) => {
        this.serializeRelationship(resource, record, relationship, model);
      });
    }
  }

  serializeRelationship(
    resource: Resource,
    record: InitializedRecord,
    relationship: string,
    model: ModelDefinition
  ): void {
    const value = record.relationships?.[relationship].data;

    if (value === undefined) {
      return;
    }
    if (model.relationships?.[relationship] === undefined) {
      return;
    }

    let data;

    if (Array.isArray(value)) {
      data = (value as RecordIdentity[]).map((id) => this.resourceIdentity(id));
    } else if (value !== null) {
      data = this.resourceIdentity(value as RecordIdentity);
    } else {
      data = null;
    }

    const resourceRelationship = this.resourceRelationship(
      record.type,
      relationship
    );

    deepSet(resource, ['relationships', resourceRelationship, 'data'], data);
  }

  deserialize(
    document: ResourceDocument,
    options?: JSONAPISerializationOptions
  ): RecordDocument {
    let result: RecordDocument;
    let data;

    if (Array.isArray(document.data)) {
      let primaryRecords = options?.primaryRecords;
      if (primaryRecords) {
        data = (document.data as Resource[]).map((entry, i) => {
          return this.deserializeResource(entry, primaryRecords?.[i]);
        });
      } else {
        data = (document.data as Resource[]).map((entry) =>
          this.deserializeResource(entry)
        );
      }
    } else if (document.data !== null) {
      let primaryRecord = options && options.primaryRecord;
      if (primaryRecord) {
        data = this.deserializeResource(
          document.data as Resource,
          primaryRecord
        );
      } else {
        data = this.deserializeResource(document.data as Resource);
      }
    } else {
      data = null;
    }
    result = { data };

    if (document.included) {
      result.included = document.included.map((e) =>
        this.deserializeResource(e)
      );
    }

    if (document.links) {
      result.links = document.links;
    }

    if (document.meta) {
      result.meta = document.meta;
    }

    return result;
  }

  deserializeAtomicOperationsDocument(
    document: ResourceAtomicOperationsDocument
  ): RecordOperationsDocument {
    const result: RecordOperationsDocument = {
      operations: this.deserializeAtomicOperations(
        document['atomic:operations']
      )
    };

    if (document.links) {
      result.links = document.links;
    }

    if (document.meta) {
      result.meta = document.meta;
    }

    return result;
  }

  deserializeAtomicOperations(
    operations: ResourceAtomicOperation[]
  ): RecordOperation[] {
    return operations.map((operation) =>
      this.deserializeAtomicOperation(operation)
    );
  }

  deserializeAtomicOperation(
    operation: ResourceAtomicOperation
  ): RecordOperation {
    return this.atomicOperationSerializer.deserialize(operation);
  }

  deserializeResourceIdentity(
    resource: Resource,
    primaryRecord?: InitializedRecord
  ): InitializedRecord {
    let record: InitializedRecord;
    const type: string = this.recordType(resource.type);
    const resourceKey = this.resourceKey(type);

    if (resourceKey === 'id') {
      if (resource.id) {
        record = { type, id: resource.id };
      } else {
        throw new Assertion(`A resource has been enountered without an id`);
      }
    } else if (this.keyMap) {
      let id: string;
      let keys: Dict<string> | undefined;

      if (resource.id) {
        keys = {
          [resourceKey]: resource.id
        };

        id =
          (primaryRecord && primaryRecord.id) ||
          this.keyMap.idFromKeys(type, keys) ||
          this.schema.generateId(type);
      } else {
        id =
          (primaryRecord && primaryRecord.id) || this.schema.generateId(type);
      }

      record = { type, id };

      if (keys) {
        record.keys = keys;
      }
    } else {
      throw new Assertion(
        `A keyMap is required to determine an id from the key '${resourceKey}'`
      );
    }

    if (this.keyMap) {
      this.keyMap.pushRecord(record);
    }

    return record;
  }

  deserializeResource(
    resource: Resource,
    primaryRecord?: InitializedRecord
  ): InitializedRecord {
    const record = this.deserializeResourceIdentity(resource, primaryRecord);
    const model: ModelDefinition = this._schema.getModel(record.type);

    this.deserializeAttributes(record, resource, model);
    this.deserializeRelationships(record, resource, model);
    this.deserializeLinks(record, resource, model);
    this.deserializeMeta(record, resource, model);

    return record;
  }

  deserializeAttributes(
    record: InitializedRecord,
    resource: Resource,
    model: ModelDefinition
  ): void {
    if (resource.attributes) {
      Object.keys(resource.attributes).forEach((resourceAttribute) => {
        let attribute = this.recordAttribute(record.type, resourceAttribute);
        if (this.schema.hasAttribute(record.type, attribute)) {
          let value = resource.attributes?.[resourceAttribute];
          if (value !== undefined) {
            this.deserializeAttribute(record, attribute, value, model);
          }
        }
      });
    }
  }

  deserializeAttribute(
    record: InitializedRecord,
    attr: string,
    value: unknown,
    model: ModelDefinition
  ): void {
    record.attributes = record.attributes || {};
    if (value !== undefined && value !== null) {
      const attrOptions = model.attributes?.[attr];
      if (attrOptions === undefined) {
        return;
      }
      const serializer = this.serializerFor(attrOptions?.type || 'unknown');
      if (serializer) {
        const deserializationOptions =
          attrOptions.deserialization ??
          (attrOptions as any).deserializationOptions;

        if ((attrOptions as any).deserializationOptions !== undefined) {
          deprecate(
            `The attribute '${attr}' for '${record.type}' has been assigned \`deserializationOptions\` in the schema. Use \`deserialization\` instead.`
          );
        }

        value = serializer.deserialize(value, deserializationOptions);
      }
    }
    record.attributes[attr] = value;
  }

  deserializeRelationships(
    record: InitializedRecord,
    resource: Resource,
    model: ModelDefinition
  ): void {
    if (resource.relationships) {
      Object.keys(resource.relationships).forEach((resourceRel) => {
        let relationship = this.recordRelationship(record.type, resourceRel);
        if (this.schema.hasRelationship(record.type, relationship)) {
          let value = resource.relationships?.[resourceRel];
          if (value !== undefined) {
            this.deserializeRelationship(record, relationship, value, model);
          }
        }
      });
    }
  }

  deserializeRelationship(
    record: InitializedRecord,
    relationship: string,
    value: ResourceRelationship,
    /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
    model: ModelDefinition
  ): void {
    let resourceData = value.data;

    if (resourceData !== undefined) {
      let data;

      if (resourceData === null) {
        data = null;
      } else if (Array.isArray(resourceData)) {
        data = (resourceData as ResourceIdentity[]).map((resourceIdentity) =>
          this.recordIdentity(resourceIdentity)
        );
      } else {
        data = this.recordIdentity(resourceData as ResourceIdentity);
      }

      deepSet(record, ['relationships', relationship, 'data'], data);
    }

    let { links, meta } = value;

    if (links !== undefined) {
      deepSet(record, ['relationships', relationship, 'links'], links);
    }

    if (meta !== undefined) {
      deepSet(record, ['relationships', relationship, 'meta'], meta);
    }
  }

  deserializeLinks(
    record: InitializedRecord,
    resource: Resource,
    /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
    model: ModelDefinition
  ): void {
    if (resource.links) {
      record.links = resource.links;
    }
  }

  deserializeMeta(
    record: InitializedRecord,
    resource: Resource,
    /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
    model: ModelDefinition
  ): void {
    if (resource.meta) {
      record.meta = resource.meta;
    }
  }

  // Protected / Private

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

  protected get atomicOperationSerializer(): JSONAPIAtomicOperationSerializer {
    return this.serializerFor(
      JSONAPISerializers.ResourceAtomicOperation
    ) as JSONAPIAtomicOperationSerializer;
  }

  protected _generateNewId(
    type: string,
    keyName: string,
    keyValue: string
  ): string {
    let id = this.schema.generateId(type);

    if (this.keyMap) {
      this.keyMap.pushRecord({
        type,
        id,
        keys: {
          [keyName]: keyValue
        }
      });
    } else {
      throw new Assertion(
        `A keyMap is required to generate ids for resource type '${type}'`
      );
    }

    return id;
  }
}
