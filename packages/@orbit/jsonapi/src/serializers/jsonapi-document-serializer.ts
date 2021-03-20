import { InitializedRecord } from '@orbit/records';
import { Resource, ResourceDocument } from '../resource-document';
import { RecordDocument } from '../record-document';
import { JSONAPIBaseSerializer } from './jsonapi-base-serializer';

export interface JSONAPIDocumentDeserializationOptions {
  primaryRecord?: InitializedRecord;
  primaryRecords?: InitializedRecord[];
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
        ? this.serializeRecords(document.data as InitializedRecord[])
        : this.serializeRecord(document.data as InitializedRecord)
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

  protected serializeRecords(records: InitializedRecord[]): Resource[] {
    return records.map((record) => this.serializeRecord(record));
  }

  protected serializeRecord(record: InitializedRecord): Resource {
    return this.resourceSerializer.serialize(record);
  }

  /* eslint-disable @typescript-eslint/no-unused-vars */
  protected serializeLinks(
    document: RecordDocument,
    resDocument: ResourceDocument
  ): void {}

  protected serializeMeta(
    document: RecordDocument,
    resDocument: ResourceDocument
  ): void {}
  /* eslint-enable @typescript-eslint/no-unused-vars */

  protected deserializeResources(
    resources: Resource[],
    primaryRecords?: InitializedRecord[]
  ): InitializedRecord[] {
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
    primaryRecord?: InitializedRecord
  ): InitializedRecord {
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
