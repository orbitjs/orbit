import { Orbit, Assertion } from '@orbit/core';
import { InitializedRecord, RecordSchema, RecordKeyMap } from '@orbit/records';
import { Dict } from '@orbit/utils';
import { Resource } from '../resource-document';
import { JSONAPIBaseSerializer } from './jsonapi-base-serializer';
import { SerializerForFn } from '@orbit/serializers';

const { assert } = Orbit;

export interface JSONAPIResourceIdentityDeserializationOptions {
  primaryRecord?: InitializedRecord;
  includeKeys?: boolean;
}

export interface JSONAPIResourceIdentitySerializerSettings {
  serializerFor: SerializerForFn;
  deserializationOptions?: JSONAPIResourceIdentityDeserializationOptions;
  schema: RecordSchema;
  keyMap?: RecordKeyMap;
  getResourceKey?: (recordType: string) => string;
}

export class JSONAPIResourceIdentitySerializer extends JSONAPIBaseSerializer<
  InitializedRecord,
  Resource,
  unknown,
  JSONAPIResourceIdentityDeserializationOptions
> {
  protected _resourceKeys: Dict<string>;
  protected _getCustomResourceKey?: (recordType: string) => string;

  getResourceKey(type: string): string {
    let key = this._resourceKeys[type];
    if (key === undefined) {
      if (this._getCustomResourceKey) {
        key = this._getCustomResourceKey(type);
      }

      if (key === undefined) {
        const model = this.schema.getModel(type);
        if (model?.keys) {
          let availableKeys = Object.keys(model.keys);
          if (availableKeys.length === 1) {
            key = availableKeys[0];
          }
        }
        if (key === undefined) {
          key = 'id';
        }
      }

      assert(
        "JSONAPIResourceIdentitySerializer requires a keyMap to support resource keys other than 'id'",
        key === 'id' || this.keyMap !== undefined
      );

      this._resourceKeys[type] = key;
    }
    return key;
  }

  constructor(settings: JSONAPIResourceIdentitySerializerSettings) {
    const {
      serializerFor,
      deserializationOptions,
      schema,
      keyMap,
      getResourceKey
    } = settings;
    super({
      serializerFor,
      deserializationOptions,
      schema,
      keyMap
    });
    this._resourceKeys = {};
    this._getCustomResourceKey = getResourceKey;
  }

  serialize(recordIdentity: InitializedRecord): Resource {
    const { type, id } = recordIdentity;
    const resourceKey = this.getResourceKey(type);
    const resourceType = this.typeSerializer.serialize(type) as string;
    const keyMap = this.keyMap as RecordKeyMap;
    const resourceId =
      resourceKey === 'id' ? id : keyMap.idToKey(type, resourceKey, id);

    const resource: Resource = {
      type: resourceType
    };

    if (resourceId !== undefined) {
      resource.id = resourceId;
    }

    return resource;
  }

  deserialize(
    resource: Resource,
    customOptions?: JSONAPIResourceIdentityDeserializationOptions
  ): InitializedRecord {
    const options = this.buildDeserializationOptions(customOptions);
    const type = this.typeSerializer.deserialize(resource.type) as string;
    const resourceKey = this.getResourceKey(type);

    if (resourceKey === 'id') {
      const { id } = resource;
      if (id) {
        return { type, id };
      } else {
        throw new Assertion(`Resource of type '${type}' is missing 'id'`);
      }
    } else {
      const keyMap = this.keyMap as RecordKeyMap;
      const primaryRecord = options?.primaryRecord;
      let id: string;
      let keys: Dict<string> | null;

      if (resource.id) {
        keys = {
          [resourceKey]: resource.id
        };

        id =
          options.primaryRecord?.id ||
          keyMap.idFromKeys(type, keys) ||
          this.schema.generateId(type);
      } else {
        keys = null;
        id =
          (primaryRecord && primaryRecord.id) || this.schema.generateId(type);
      }

      const record: InitializedRecord = { type, id };

      if (keys) {
        if (options.includeKeys) {
          record.keys = keys;
          keyMap.pushRecord(record);
        } else {
          keyMap.pushRecord({
            type,
            id,
            keys
          });
        }
      }

      return record;
    }
  }
}
