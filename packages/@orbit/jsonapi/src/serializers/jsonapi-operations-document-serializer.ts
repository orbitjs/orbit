import {
  RecordOperationsDocument,
  ResourceOperationsDocument
} from '../resource-operations';
import { JSONAPIBaseSerializer } from './jsonapi-base-serializer';

export class JSONAPIOperationsDocumentSerializer extends JSONAPIBaseSerializer<
  RecordOperationsDocument,
  ResourceOperationsDocument,
  unknown,
  unknown
> {
  serialize(document: RecordOperationsDocument): ResourceOperationsDocument {
    const { operations } = document;
    return {
      operations: operations.map((operation) =>
        this.operationSerializer.serialize(operation)
      )
    };
  }

  deserialize(document: ResourceOperationsDocument): RecordOperationsDocument {
    const { operations } = document;
    return {
      operations: operations.map((operation) =>
        this.operationSerializer.deserialize(operation)
      )
    };
  }
}
