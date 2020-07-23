import { Record } from '@orbit/data';
import { RecordDocument, Resource, ResourceDocument } from '../resources';
import { JSONAPIBaseSerializer } from './jsonapi-base-serializer';

export interface JSONAPIDocumentDeserializationOptions {
  primaryRecord?: Record;
  primaryRecords?: Record[];
}

export class JSONAPIDocumentSerializer extends JSONAPIBaseSerializer<
  RecordDocument,
  ResourceDocument,
  unknown,
  JSONAPIDocumentDeserializationOptions
> {
  serialize(document: RecordDocument): ResourceDocument {
    let resDocument: ResourceDocument = {
      data: Array.isArray(document.data)
        ? this.serializeRecords(document.data as Record[])
        : this.serializeRecord(document.data as Record)
    };

    this.serializeLinks(document, resDocument);
    this.serializeMeta(document, resDocument);

    return resDocument;
  }

  deserialize(
    resDocument: ResourceDocument,
    customOptions?: JSONAPIDocumentDeserializationOptions
  ): RecordDocument {
    const options = this.buildSerializationOptions(
      customOptions
    ) as JSONAPIDocumentDeserializationOptions;
    let resData = resDocument.data;
    let data;

    if (Array.isArray(resData)) {
      data = this.deserializeResources(
        resData as Resource[],
        options?.primaryRecords
      );
    } else if (resData !== null) {
      data = this.deserializeResource(
        resData as Resource,
        options?.primaryRecord
      );
    } else {
      data = null;
    }

    let result: RecordDocument = { data };

    if (resDocument.included) {
      result.included = resDocument.included.map((e) =>
        this.deserializeResource(e)
      );
    }

    this.deserializeLinks(resDocument, result);
    this.deserializeMeta(resDocument, result);

    return result;
  }

  protected serializeRecords(records: Record[]): Resource[] {
    return records.map((record) => this.serializeRecord(record));
  }

  protected serializeRecord(record: Record): Resource {
    return this.resourceSerializer.serialize(record);
  }

  protected serializeLinks(
    document: RecordDocument,
    resDocument: ResourceDocument
  ): void {}

  protected serializeMeta(
    document: RecordDocument,
    resDocument: ResourceDocument
  ): void {}

  protected deserializeResources(
    resources: Resource[],
    primaryRecords?: Record[]
  ): Record[] {
    if (primaryRecords) {
      return resources.map((entry, i) => {
        return this.deserializeResource(entry, primaryRecords[i]);
      });
    } else {
      return resources.map((entry) => this.deserializeResource(entry));
    }
  }

  protected deserializeResource(
    resource: Resource,
    primaryRecord?: Record
  ): Record {
    if (primaryRecord) {
      return this.resourceSerializer.deserialize(resource, { primaryRecord });
    } else {
      return this.resourceSerializer.deserialize(resource);
    }
  }

  protected deserializeLinks(
    resDocument: ResourceDocument,
    document: RecordDocument
  ): void {
    if (resDocument.links) {
      document.links = resDocument.links;
    }
  }

  protected deserializeMeta(
    resDocument: ResourceDocument,
    document: RecordDocument
  ): void {
    if (resDocument.meta) {
      document.meta = resDocument.meta;
    }
  }
}
