import { deepSet } from '@orbit/utils';
import { Assertion, Orbit } from '@orbit/core';
import {
  InitializedRecord,
  RecordIdentity,
  ModelDefinition
} from '@orbit/records';
import { Resource, ResourceIdentity } from '../resource-document';
import { JSONAPIBaseSerializer } from './jsonapi-base-serializer';
import { JSONAPIResourceIdentityDeserializationOptions } from './jsonapi-resource-identity-serializer';

const { deprecate } = Orbit;
export class JSONAPIResourceSerializer extends JSONAPIBaseSerializer<
  InitializedRecord,
  Resource,
  unknown,
  JSONAPIResourceIdentityDeserializationOptions
> {
  serialize(record: InitializedRecord): Resource {
    const resource: Resource = this.identitySerializer.serialize(record);
    const model: ModelDefinition = this.schema.getModel(record.type);

    this.serializeAttributes(resource, record, model);
    this.serializeRelationships(resource, record, model);
    this.serializeLinks(resource, record, model);
    this.serializeMeta(resource, record, model);

    return resource;
  }

  deserialize(
    resource: Resource,
    customOptions?: JSONAPIResourceIdentityDeserializationOptions
  ): InitializedRecord {
    const options = this.buildDeserializationOptions(customOptions);
    options.includeKeys = true;
    const record: InitializedRecord = this.identitySerializer.deserialize(
      resource as ResourceIdentity,
      options
    );
    const model: ModelDefinition = this.schema.getModel(record.type);

    this.deserializeAttributes(record, resource, model);
    this.deserializeRelationships(record, resource, model);
    this.deserializeLinks(record, resource, model);
    this.deserializeMeta(record, resource, model);

    return record;
  }

  protected serializeAttributes(
    resource: Resource,
    record: InitializedRecord,
    model: ModelDefinition
  ): void {
    if (record.attributes) {
      for (let field of Object.keys(record.attributes)) {
        this.serializeAttribute(resource, record, field, model);
      }
    }
  }

  protected serializeAttribute(
    resource: Resource,
    record: InitializedRecord,
    field: string,
    model: ModelDefinition
  ): void {
    const value = record.attributes?.[field];
    if (value === undefined) {
      return;
    }

    const fieldOptions = model.attributes?.[field];
    if (fieldOptions === undefined) {
      return;
    }

    let resValue: unknown;
    if (value === null) {
      resValue = null;
    } else {
      const type = fieldOptions.type ?? 'unknown';
      const serializer = this.serializerFor(type);
      if (serializer) {
        const serializationOptions =
          fieldOptions.serialization ??
          (fieldOptions as any).serializationOptions;

        if ((fieldOptions as any).serializationOptions !== undefined) {
          // TODO: Remove in v0.18
          deprecate(
            `The attribute '${field}' for '${record.type}' has been assigned \`serializationOptions\` in the schema. Use \`serialization\` instead.`
          );
        }

        resValue = serializer.serialize(value, serializationOptions);
      } else {
        throw new Assertion(
          `Serializer could not be found for attribute type '${type}'`
        );
      }
    }

    const resField = this.fieldSerializer.serialize(field, {
      type: record.type
    }) as string;

    deepSet(resource, ['attributes', resField], resValue);
  }

  protected serializeRelationships(
    resource: Resource,
    record: InitializedRecord,
    model: ModelDefinition
  ): void {
    if (record.relationships) {
      for (let field of Object.keys(record.relationships)) {
        this.serializeRelationship(resource, record, field, model);
      }
    }
  }

  protected serializeRelationship(
    resource: Resource,
    record: InitializedRecord,
    field: string,
    model: ModelDefinition
  ): void {
    const value = record.relationships?.[field].data;

    if (value === undefined) {
      return;
    }
    if (model.relationships?.[field] === undefined) {
      return;
    }

    let resValue;

    if (value === null) {
      resValue = null;
    } else {
      const identitySerializer = this.identitySerializer;

      if (Array.isArray(value)) {
        resValue = (value as RecordIdentity[]).map((identity) =>
          identitySerializer.serialize(identity)
        );
      } else {
        resValue = identitySerializer.serialize(value);
      }
    }

    const resField = this.fieldSerializer.serialize(field, {
      type: record.type
    }) as string;

    deepSet(resource, ['relationships', resField, 'data'], resValue);
  }

  /* eslint-disable @typescript-eslint/no-unused-vars */
  protected serializeLinks(
    resource: Resource,
    record: InitializedRecord,
    model: ModelDefinition
  ): void {}

  protected serializeMeta(
    resource: Resource,
    record: InitializedRecord,
    model: ModelDefinition
  ): void {}
  /* eslint-enable @typescript-eslint/no-unused-vars */

  protected deserializeAttributes(
    record: InitializedRecord,
    resource: Resource,
    model: ModelDefinition
  ): void {
    if (resource.attributes) {
      for (let resField of Object.keys(resource.attributes)) {
        this.deserializeAttribute(record, resource, resField, model);
      }
    }
  }

  protected deserializeAttribute(
    record: InitializedRecord,
    resource: Resource,
    resField: string,
    model: ModelDefinition
  ): void {
    const resValue: any = resource.attributes?.[resField];
    if (resValue === undefined) {
      return;
    }

    const field = this.fieldSerializer.deserialize(resField, {
      type: record.type
    }) as string;

    const fieldOptions = model.attributes?.[field];
    if (fieldOptions === undefined) {
      return;
    }

    let value: unknown;
    if (resValue === null) {
      value = null;
    } else {
      const type = fieldOptions.type || 'unknown';
      const serializer = this.serializerFor(type);
      if (serializer) {
        const deserializationOptions =
          fieldOptions.deserialization ??
          (fieldOptions as any).deserializationOptions;

        if ((fieldOptions as any).deserializationOptions !== undefined) {
          // TODO: Remove in v0.18
          deprecate(
            `The attribute '${field}' for '${record.type}' has been assigned \`deserializationOptions\` in the schema. Use \`deserialization\` instead.`
          );
        }

        value = serializer.deserialize(resValue, deserializationOptions);
      } else {
        throw new Assertion(
          `Serializer could not be found for attribute type '${type}'`
        );
      }
    }

    deepSet(record, ['attributes', field], value);
  }

  protected deserializeRelationships(
    record: InitializedRecord,
    resource: Resource,
    model: ModelDefinition
  ): void {
    if (resource.relationships) {
      for (let resField of Object.keys(resource.relationships)) {
        this.deserializeRelationship(record, resource, resField, model);
      }
    }
  }

  protected deserializeRelationship(
    record: InitializedRecord,
    resource: Resource,
    resField: string,
    model: ModelDefinition
  ): void {
    const resValue: any = resource.relationships?.[resField];
    if (!resValue) {
      return;
    }

    const field = this.fieldSerializer.deserialize(resField, {
      type: record.type
    }) as string;

    const fieldOptions = model.relationships?.[field];
    if (fieldOptions === undefined) {
      return;
    }

    let resData = resValue.data;

    if (resData !== undefined) {
      let data;

      if (resData === null) {
        data = null;
      } else {
        const identitySerializer = this.identitySerializer;

        if (Array.isArray(resData)) {
          data = (resData as ResourceIdentity[]).map((resourceIdentity) =>
            identitySerializer.deserialize(resourceIdentity)
          );
        } else {
          data = identitySerializer.deserialize(resData as ResourceIdentity);
        }
      }

      deepSet(record, ['relationships', field, 'data'], data);
    }

    let { links, meta } = resValue;

    if (links !== undefined) {
      deepSet(record, ['relationships', field, 'links'], links);
    }

    if (meta !== undefined) {
      deepSet(record, ['relationships', field, 'meta'], meta);
    }
  }

  protected deserializeLinks(
    record: InitializedRecord,
    resource: Resource,
    /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
    model: ModelDefinition
  ): void {
    if (resource.links) {
      record.links = resource.links;
    }
  }

  protected deserializeMeta(
    record: InitializedRecord,
    resource: Resource,
    /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
    model: ModelDefinition
  ): void {
    if (resource.meta) {
      record.meta = resource.meta;
    }
  }
}
