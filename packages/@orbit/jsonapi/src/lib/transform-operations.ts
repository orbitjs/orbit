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
  TransformBuilder
} from "@orbit/data";

interface JSONAPIOperation {
  op: "get" | "add" | "update" | "remove";
  ref: {
    type: string;
    id?: string | number;
    relationship?: string;
  };
  data?: Resource | Resource[];
}

export function transformsToJSONAPIOperations(
  source: JSONAPISource,
  transformBuilder: TransformBuilder,
  transforms: TransformOrOperations
) {
  const transform = buildTransform(
    transforms,
    undefined,
    undefined,
    transformBuilder
  );
  const data = transformsToOperationsData(source, transform);

  return data;
}

export function transformsToOperationsData(
  source: JSONAPISource,
  transform: Transform
): JSONAPIOperation[] {
  return transform.operations.map((orbitOperation: Operation) => {
    const converter = TransformToOperationData[orbitOperation.op];

    return converter(source, orbitOperation);
  });
}

type TransformToOperationFunction = (
  source: JSONAPISource,
  operation: any
) => JSONAPIOperation;

export const TransformToOperationData: Dict<TransformToOperationFunction> = {
  addRecord(
    source: JSONAPISource,
    operation: AddRecordOperation
  ): JSONAPIOperation {
    const { serializer } = source;
    const record = operation.record;
    const requestDoc: ResourceDocument = serializer.serializeDocument(record);

    return {
      op: "add",
      ref: {
        type: record.type,
        id: record.id
      },
      data: requestDoc.data
    };
  },

  removeRecord(
    source: JSONAPISource,
    operation: RemoveRecordOperation
  ): JSONAPIOperation {
    const { type, id } = operation.record;

    return {
      op: "remove",
      ref: { type, id }
    };
  },

  updateRecord(
    source: JSONAPISource,
    operation: UpdateRecordOperation
  ): JSONAPIOperation {
    const { serializer } = source;
    const record = operation.record;
    const { type, id } = record;
    const requestDoc: ResourceDocument = serializer.serializeDocument(record);

    return {
      op: "update",
      ref: { type, id },
      data: requestDoc.data
    };
  },

  addToRelatedRecords(
    source: JSONAPISource,
    operation: AddToRelatedRecordsOperation
  ): JSONAPIOperation {
    const { type, id } = operation.record;
    const { relationship } = operation;
    const data = source.serializer.resourceIdentity(operation.relatedRecord);

    return {
      op: "add",
      ref: { type, id, relationship },
      data
    };
  },

  removeFromRelatedRecords(
    source: JSONAPISource,
    operation: RemoveFromRelatedRecordsOperation
  ): JSONAPIOperation {
    const { type, id } = operation.record;
    const { relationship } = operation;
    const data = source.serializer.resourceIdentity(operation.relatedRecord);

    return {
      op: "remove",
      ref: { type, id, relationship },
      data
    };
  },

  replaceRelatedRecord(
    source: JSONAPISource,
    operation: ReplaceRelatedRecordOperation
  ): JSONAPIOperation {
    const { type, id } = operation.record;
    const { relationship, relatedRecord } = operation;
    const data = relatedRecord
      ? source.serializer.resourceIdentity(relatedRecord)
      : null;

    return {
      op: "update",
      ref: { type, id, relationship },
      data
    };
  },

  replaceRelatedRecords(
    source: JSONAPISource,
    operation: ReplaceRelatedRecordsOperation
  ): JSONAPIOperation {
    const { type, id } = operation.record;
    const { relationship, relatedRecords } = operation;
    const data = relatedRecords.map(r => source.serializer.resourceIdentity(r));

    return {
      op: "update",
      ref: { type, id, relationship },
      data
    };
  }
};
