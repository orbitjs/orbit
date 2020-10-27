import { deepSet } from '@orbit/utils';
import { Assertion } from '@orbit/core';
import { Record, RecordIdentity, ModelDefinition } from '@orbit/records';
import { Resource, ResourceIdentity } from '../resource-document';
import { JSONAPIBaseSerializer } from './jsonapi-base-serializer';
import { JSONAPIResourceIdentityDeserializationOptions } from './jsonapi-resource-identity-serializer';

export class JSONAPIResourceSerializer extends JSONAPIBaseSerializer<
  Record,
  Resource,
  unknown,
  JSONAPIResourceIdentityDeserializationOptions
> {
  serialize(record: Record): Resource {
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
  ): Record {
    const options = this.buildDeserializationOptions(customOptions);
    options.includeKeys = true;
    const record: Record = this.identitySerializer.deserialize(
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
    record: Record,
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
    record: Record,
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

    let resValue: any;
    if (value === null) {
      resValue = null;
    } else {
      const type = fieldOptions.type || 'unknown';
      const serializer = this.serializerFor(type);
      if (serializer) {
        resValue = serializer.serialize(
          value,
          fieldOptions.serializationOptions
        );
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
    record: Record,
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
    record: Record,
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
    record: Record,
    model: ModelDefinition
  ): void {}

  protected serializeMeta(
    resource: Resource,
    record: Record,
    model: ModelDefinition
  ): void {}
  /* eslint-enable @typescript-eslint/no-unused-vars */

  protected deserializeAttributes(
    record: Record,
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
    record: Record,
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

    let value: any;
    if (resValue === null) {
      value = null;
    } else {
      const type = fieldOptions.type || 'unknown';
      const serializer = this.serializerFor(type);
      if (serializer) {
        value = serializer.deserialize(
          resValue,
          fieldOptions.serializationOptions
        );
      } else {
        throw new Assertion(
          `Serializer could not be found for attribute type '${type}'`
        );
      }
    }

    deepSet(record, ['attributes', field], value);
  }

  protected deserializeRelationships(
    record: Record,
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
    record: Record,
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
    record: Record,
    resource: Resource,
    /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
    model: ModelDefinition
  ): void {
    if (resource.links) {
      record.links = resource.links;
    }
  }

  protected deserializeMeta(
    record: Record,
    resource: Resource,
    /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
    model: ModelDefinition
  ): void {
    if (resource.meta) {
      record.meta = resource.meta;
    }
  }
}
