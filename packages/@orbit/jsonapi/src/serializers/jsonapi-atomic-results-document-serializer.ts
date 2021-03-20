import { InitializedRecord } from '@orbit/records';
import {
  RecordResultsDocument,
  ResourceAtomicResultsDocument
} from '../resource-operations';
import { Resource } from '../resource-document';
import { JSONAPIBaseSerializer } from './jsonapi-base-serializer';

export class JSONAPIAtomicResultsDocumentSerializer extends JSONAPIBaseSerializer<
  RecordResultsDocument,
  ResourceAtomicResultsDocument,
  unknown,
  unknown
> {
  serialize(document: RecordResultsDocument): ResourceAtomicResultsDocument {
    const result: ResourceAtomicResultsDocument = {
      'atomic:results': this.serializeResults(document.results)
    };

    this.serializeLinks(document, result);
    this.serializeMeta(document, result);

    return result;
  }

  serializeResults(results: InitializedRecord[]): Resource[] {
    return results.map((record) => this.resourceSerializer.serialize(record));
  }

  /* eslint-disable @typescript-eslint/no-unused-vars */
  protected serializeLinks(
    document: RecordResultsDocument,
    resDocument: ResourceAtomicResultsDocument
  ): void {}

  protected serializeMeta(
    document: RecordResultsDocument,
    resDocument: ResourceAtomicResultsDocument
  ): void {}
  /* eslint-enable @typescript-eslint/no-unused-vars */

  deserialize(document: ResourceAtomicResultsDocument): RecordResultsDocument {
    const result: RecordResultsDocument = {
      results: this.deserializeAtomicResults(document['atomic:results'])
    };

    this.deserializeLinks(document, result);
    this.deserializeMeta(document, result);

    return result;
  }

  deserializeAtomicResults(results: Resource[]): InitializedRecord[] {
    return results.map((resource) =>
      this.resourceSerializer.deserialize(resource)
    );
  }

  protected deserializeLinks(
    resDocument: ResourceAtomicResultsDocument,
    document: RecordResultsDocument
  ): void {
    if (resDocument.links) {
      document.links = resDocument.links;
    }
  }

  protected deserializeMeta(
    resDocument: ResourceAtomicResultsDocument,
    document: RecordResultsDocument
  ): void {
    if (resDocument.meta) {
      document.meta = resDocument.meta;
    }
  }
}
