import { Dict } from "@orbit/utils";

import JSONAPISource, { Resource, ResourceDocument } from "..";
import {
  TransformOrOperations,
  buildTransform,
  Transform,
  Operation,
  AddRecordOperation,
  RemoveRecordOperation,
  AddToRelatedRecordsOperation,
  RemoveFromRelatedRecordsOperation,
  ReplaceRelatedRecordOperation,
  ReplaceRelatedRecordsOperation,
  TransformBuilder,
  cloneRecordIdentity,
  ReplaceAttributeOperation,
  ReplaceRecordOperation,
  RecordIdentity
} from "@orbit/data";
import { replaceRecordAttribute } from "./transform-requests";

interface JSONAPIOperation {
  op: "get" | "add" | "update" | "remove";
  ref: {
    type: string;
    id?: string | number;
    relationship?: string;
  };
  data?: Resource | Resource[];
}

interface JSONAPIOperationsPayload {
  operations: JSONAPIOperation[];
}

export function transformsToJSONAPIOperations(
  source: JSONAPISource,
  transformBuilder: TransformBuilder,
  transforms: TransformOrOperations
): JSONAPIOperationsPayload {
  const transform = buildTransform(
    transforms,
    undefined,
    undefined,
    transformBuilder
  );
  const operations = transformsToOperationsData(source, transform);

  const data = {
    operations
  };

  return data;
}

export function toRecordIdentity(record: Resource): RecordIdentity {
  const { type, id } = record;

  return { type, id };
}

interface JSONAPIOperationsPayload {
  operations: JSONAPIOperation[];
}

function transformsToOperationsData(
  source: JSONAPISource,
  transform: Transform
): JSONAPIOperation[] {
  return transform.operations.map((orbitOperation: Operation) => {
    const converter = TransformToOperationData[orbitOperation.op];

    return converter(source, orbitOperation);
  });
}

interface JSONAPIOperation {
  op: "get" | "add" | "update" | "remove";
  ref: {
    type: string;
    id?: string | number;
    relationship?: string;
  };
  data?: Resource | Resource[];
}

type TransformToOperationFunction = (
  source: JSONAPISource,
  operation: any
) => JSONAPIOperation;

export const TransformToOperationData: Dict<TransformToOperationFunction> = {
  addRecord(
    { serializer }: JSONAPISource,
    operation: AddRecordOperation
  ): JSONAPIOperation {
    const resource = serializer.serializeRecord(operation.record);
    const { type, id } = resource;

    return {
      op: "add",
      ref: { type, id },
      data: resource
    };
  },

  removeRecord(
    { serializer }: JSONAPISource,
    operation: RemoveRecordOperation
  ): JSONAPIOperation {
    const { type, id } = serializer.serializeRecord(operation.record);

    return {
      op: "remove",
      ref: { type, id }
    };
  },

  updateRecord(
    { serializer }: JSONAPISource,
    operation: ReplaceRecordOperation
  ): JSONAPIOperation {
    const resource = serializer.serializeRecord(operation.record);
    const { type, id } = resource;

    return {
      op: "update",
      ref: { type, id },
      data: resource
    };
  },

  replaceAttribute(
    { serializer }: JSONAPISource,
    operation: ReplaceAttributeOperation
  ): JSONAPIOperation {
    const resource = serializer.serializeRecord(operation.record);
    const { type, id } = resource;
    const record = toRecordIdentity(resource);

    replaceRecordAttribute(record, operation.attribute, operation.value);

    return {
      op: "update",
      ref: { type, id },
      data: record
    };
  },

  addToRelatedRecords(
    { serializer }: JSONAPISource,
    operation: AddToRelatedRecordsOperation
  ): JSONAPIOperation {
    const relatedResource = serializer.serializeRecord(operation.relatedRecord);
    const { type, id } = serializer.serializeRecord(operation.record);
    const { relationship } = operation;

    return {
      op: "add",
      ref: { type, id, relationship },
      data: relatedResource
    };
  },

  removeFromRelatedRecords(
    { serializer }: JSONAPISource,
    operation: RemoveFromRelatedRecordsOperation
  ): JSONAPIOperation {
    const { type, id } = serializer.serializeRecord(operation.record);
    const { relationship } = operation;
    const relatedResource = serializer.serializeRecord(operation.relatedRecord);

    return {
      op: "remove",
      ref: { type, id, relationship },
      data: relatedResource
    };
  },

  replaceRelatedRecord(
    { serializer }: JSONAPISource,
    operation: ReplaceRelatedRecordOperation
  ): JSONAPIOperation {
    const { type, id } = serializer.serializeRecord(operation.record);
    const { relationship, relatedRecord } = operation;
    const data = relatedRecord
      ? serializer.resourceIdentity(relatedRecord)
      : null;

    return {
      op: "update",
      ref: { type, id, relationship },
      data
    };
  },

  replaceRelatedRecords(
    { serializer }: JSONAPISource,
    operation: ReplaceRelatedRecordsOperation
  ): JSONAPIOperation {
    const { type, id } = serializer.serializeRecord(operation.record);
    const { relationship, relatedRecords } = operation;
    const data = relatedRecords.map(r => serializer.resourceIdentity(r));

    return {
      op: "update",
      ref: { type, id, relationship },
      data
    };
  }
};
