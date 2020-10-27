import { RecordOperation } from '@orbit/records';
import {
  ResourceAtomicOperation,
  RecordOperationsDocument,
  ResourceAtomicOperationsDocument
} from '../resource-operations';
import { JSONAPIBaseSerializer } from './jsonapi-base-serializer';

export class JSONAPIAtomicOperationsDocumentSerializer extends JSONAPIBaseSerializer<
  RecordOperationsDocument,
  ResourceAtomicOperationsDocument,
  unknown,
  unknown
> {
  serialize(
    document: RecordOperationsDocument
  ): ResourceAtomicOperationsDocument {
    const result: ResourceAtomicOperationsDocument = {
      'atomic:operations': this.serializeAtomicOperations(document.operations)
    };

    this.serializeLinks(document, result);
    this.serializeMeta(document, result);

    return result;
  }

  protected serializeAtomicOperations(
    operations: RecordOperation[]
  ): ResourceAtomicOperation[] {
    return operations.map((operation) =>
      this.serializeAtomicOperation(operation)
    );
  }

  protected serializeAtomicOperation(
    operation: RecordOperation
  ): ResourceAtomicOperation {
    return this.atomicOperationSerializer.serialize(operation);
  }

  /* eslint-disable @typescript-eslint/no-unused-vars */
  protected serializeLinks(
    document: RecordOperationsDocument,
    resDocument: ResourceAtomicOperationsDocument
  ): void {}

  protected serializeMeta(
    document: RecordOperationsDocument,
    resDocument: ResourceAtomicOperationsDocument
  ): void {}
  /* eslint-enable @typescript-eslint/no-unused-vars */

  deserialize(
    document: ResourceAtomicOperationsDocument
  ): RecordOperationsDocument {
    const result: RecordOperationsDocument = {
      operations: this.deserializeAtomicOperations(
        document['atomic:operations']
      )
    };

    this.deserializeLinks(document, result);
    this.deserializeMeta(document, result);

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

  protected deserializeLinks(
    resDocument: ResourceAtomicOperationsDocument,
    document: RecordOperationsDocument
  ): void {
    if (resDocument.links) {
      document.links = resDocument.links;
    }
  }

  protected deserializeMeta(
    resDocument: ResourceAtomicOperationsDocument,
    document: RecordOperationsDocument
  ): void {
    if (resDocument.meta) {
      document.meta = resDocument.meta;
    }
  }
}
