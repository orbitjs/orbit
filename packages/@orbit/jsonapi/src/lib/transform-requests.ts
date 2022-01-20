import { clone, deepSet, Dict, toArray } from '@orbit/utils';
import {
  cloneRecordIdentity,
  equalRecordIdentities,
  recordDiffs,
  InitializedRecord,
  RecordIdentity,
  RecordOperation,
  AddRecordOperation,
  RemoveRecordOperation,
  ReplaceAttributeOperation,
  AddToRelatedRecordsOperation,
  RemoveFromRelatedRecordsOperation,
  ReplaceRelatedRecordOperation,
  ReplaceRelatedRecordsOperation,
  RecordTransform,
  RecordOperationResult
} from '@orbit/records';
import { buildTransform, FullResponse } from '@orbit/data';
import { JSONAPIRequestProcessor } from '../jsonapi-request-processor';
import { ResourceDocument } from '../resource-document';
import { RecordDocument } from '../record-document';
import { JSONAPIRequestOptions } from './jsonapi-request-options';
import { JSONAPISerializers } from '../serializers/jsonapi-serializers';
import { JSONAPIDocumentSerializer } from '../serializers/jsonapi-document-serializer';
import { JSONAPIResourceIdentitySerializer } from '../serializers/jsonapi-resource-identity-serializer';
import { JSONAPIResponse } from '../jsonapi-response';

export interface BaseTransformRecordRequest {
  op: string;
  options?: JSONAPIRequestOptions;
  record: RecordIdentity;
}

export interface TransformRecordRelationshipRequest
  extends BaseTransformRecordRequest {
  relationship: string;
}

export interface AddRecordRequest extends BaseTransformRecordRequest {
  op: 'addRecord';
  record: InitializedRecord;
}

export interface RemoveRecordRequest extends BaseTransformRecordRequest {
  op: 'removeRecord';
}

export interface UpdateRecordRequest extends BaseTransformRecordRequest {
  op: 'updateRecord';
  record: InitializedRecord;
}

export interface AddToRelatedRecordsRequest
  extends TransformRecordRelationshipRequest {
  op: 'addToRelatedRecords';
  relatedRecords: RecordIdentity[];
}

export interface RemoveFromRelatedRecordsRequest
  extends TransformRecordRelationshipRequest {
  op: 'removeFromRelatedRecords';
  relatedRecords: RecordIdentity[];
}

export interface ReplaceRelatedRecordRequest
  extends TransformRecordRelationshipRequest {
  op: 'replaceRelatedRecord';
  relatedRecord: RecordIdentity;
}

export interface ReplaceRelatedRecordsRequest
  extends TransformRecordRelationshipRequest {
  op: 'replaceRelatedRecord';
  relatedRecords: RecordIdentity[];
}

export type RecordTransformRequest =
  | AddRecordRequest
  | RemoveRecordRequest
  | UpdateRecordRequest
  | AddToRelatedRecordsRequest
  | RemoveFromRelatedRecordsRequest
  | ReplaceRelatedRecordRequest
  | ReplaceRelatedRecordsRequest;

export type TransformRequestProcessorResponse = FullResponse<
  RecordOperationResult,
  JSONAPIResponse,
  RecordOperation
>;

export interface TransformRequestProcessor {
  (
    requestProcessor: JSONAPIRequestProcessor,
    request: RecordTransformRequest
  ): Promise<TransformRequestProcessorResponse>;
}

export const TransformRequestProcessors: Dict<TransformRequestProcessor> = {
  async addRecord(
    requestProcessor: JSONAPIRequestProcessor,
    request: RecordTransformRequest
  ): Promise<TransformRequestProcessorResponse> {
    const { record } = request as AddRecordRequest;
    const serializer = requestProcessor.serializerFor(
      JSONAPISerializers.ResourceDocument
    ) as JSONAPIDocumentSerializer;
    const requestDoc = serializer.serialize({
      data: record
    }) as ResourceDocument;
    const settings = {
      ...requestProcessor.buildFetchSettings(request),
      method: 'POST',
      json: requestDoc
    };
    const url =
      request.options?.url ??
      requestProcessor.urlBuilder.resourceURL(record.type);

    const details = await requestProcessor.fetch(url, settings);
    const document = details.document as ResourceDocument;
    requestProcessor.preprocessResponseDocument(document, request);

    const recordDoc = serializer.deserialize(document, {
      primaryRecord: record
    });
    return handleChanges(record, recordDoc, details);
  },

  async removeRecord(
    requestProcessor: JSONAPIRequestProcessor,
    request: RecordTransformRequest
  ): Promise<TransformRequestProcessorResponse> {
    const { record } = request as RemoveRecordRequest;
    const { type, id } = record;
    const settings = {
      ...requestProcessor.buildFetchSettings(request),
      method: 'DELETE'
    };
    const url =
      request.options?.url ?? requestProcessor.urlBuilder.resourceURL(type, id);

    const details = await requestProcessor.fetch(url, settings);
    return { transforms: [], data: record, details };
  },

  async updateRecord(
    requestProcessor: JSONAPIRequestProcessor,
    request: RecordTransformRequest
  ): Promise<TransformRequestProcessorResponse> {
    const { record } = request as UpdateRecordRequest;
    const { type, id } = record;
    const serializer = requestProcessor.serializerFor(
      JSONAPISerializers.ResourceDocument
    ) as JSONAPIDocumentSerializer;
    const requestDoc = serializer.serialize({
      data: record
    }) as ResourceDocument;
    const settings = {
      ...requestProcessor.buildFetchSettings(request),
      method: 'PATCH',
      json: requestDoc
    };
    const url =
      request.options?.url ?? requestProcessor.urlBuilder.resourceURL(type, id);

    const details = await requestProcessor.fetch(url, settings);
    const { document } = details;
    if (document) {
      requestProcessor.preprocessResponseDocument(document, request);
      const recordDoc = serializer.deserialize(document, {
        primaryRecord: record
      });
      return handleChanges(record, recordDoc, details);
    } else {
      return { transforms: [], data: record, details };
    }
  },

  async addToRelatedRecords(
    requestProcessor: JSONAPIRequestProcessor,
    request: RecordTransformRequest
  ): Promise<TransformRequestProcessorResponse> {
    const {
      relationship,
      record,
      relatedRecords
    } = request as AddToRelatedRecordsRequest;
    const { type, id } = record;
    const resourceIdentitySerializer = requestProcessor.serializerFor(
      JSONAPISerializers.ResourceIdentity
    ) as JSONAPIResourceIdentitySerializer;
    const json = {
      data: relatedRecords.map((r) => resourceIdentitySerializer.serialize(r))
    };
    const settings = {
      ...requestProcessor.buildFetchSettings(request),
      method: 'POST',
      json
    };
    const url =
      request.options?.url ??
      requestProcessor.urlBuilder.resourceRelationshipURL(
        type,
        id,
        relationship
      );

    const details = await requestProcessor.fetch(url, settings);
    return { transforms: [], data: record, details };
  },

  async removeFromRelatedRecords(
    requestProcessor: JSONAPIRequestProcessor,
    request: RecordTransformRequest
  ): Promise<TransformRequestProcessorResponse> {
    const {
      relationship,
      record,
      relatedRecords
    } = request as RemoveFromRelatedRecordsRequest;
    const { type, id } = record;
    const resourceIdentitySerializer = requestProcessor.serializerFor(
      JSONAPISerializers.ResourceIdentity
    ) as JSONAPIResourceIdentitySerializer;
    const json = {
      data: relatedRecords.map((r) => resourceIdentitySerializer.serialize(r))
    };
    const settings = {
      ...requestProcessor.buildFetchSettings(request),
      method: 'DELETE',
      json
    };
    const url =
      request.options?.url ??
      requestProcessor.urlBuilder.resourceRelationshipURL(
        type,
        id,
        relationship
      );

    const details = await requestProcessor.fetch(url, settings);
    return { transforms: [], data: record, details };
  },

  async replaceRelatedRecord(
    requestProcessor: JSONAPIRequestProcessor,
    request: RecordTransformRequest
  ): Promise<TransformRequestProcessorResponse> {
    const {
      relationship,
      relatedRecord,
      record
    } = request as ReplaceRelatedRecordRequest;
    const { type, id } = record;
    const resourceIdentitySerializer = requestProcessor.serializerFor(
      JSONAPISerializers.ResourceIdentity
    ) as JSONAPIResourceIdentitySerializer;
    const json = {
      data: relatedRecord
        ? resourceIdentitySerializer.serialize(relatedRecord)
        : null
    };
    const settings = {
      ...requestProcessor.buildFetchSettings(request),
      method: 'PATCH',
      json
    };
    const url =
      request.options?.url ??
      requestProcessor.urlBuilder.resourceRelationshipURL(
        type,
        id,
        relationship
      );

    const details = await requestProcessor.fetch(url, settings);
    return { transforms: [], data: record, details };
  },

  async replaceRelatedRecords(
    requestProcessor: JSONAPIRequestProcessor,
    request: RecordTransformRequest
  ): Promise<TransformRequestProcessorResponse> {
    const {
      relationship,
      relatedRecords,
      record
    } = request as ReplaceRelatedRecordsRequest;
    const { type, id } = record;
    const resourceIdentitySerializer = requestProcessor.serializerFor(
      JSONAPISerializers.ResourceIdentity
    ) as JSONAPIResourceIdentitySerializer;
    const json = {
      data: relatedRecords.map((r) => resourceIdentitySerializer.serialize(r))
    };
    const settings = {
      ...requestProcessor.buildFetchSettings(request),
      method: 'PATCH',
      json
    };
    const url =
      request.options?.url ??
      requestProcessor.urlBuilder.resourceRelationshipURL(
        type,
        id,
        relationship
      );

    const details = await requestProcessor.fetch(url, settings);
    return { transforms: [], data: record, details };
  }
};

export function getTransformRequests(
  requestProcessor: JSONAPIRequestProcessor,
  transform: RecordTransform
): RecordTransformRequest[] {
  const requests: RecordTransformRequest[] = [];
  let prevRequest: RecordTransformRequest | null = null;

  for (let operation of toArray(transform.operations)) {
    let request;
    let newRequestNeeded = true;

    if (
      prevRequest &&
      equalRecordIdentities(prevRequest.record, operation.record)
    ) {
      if (operation.op === 'removeRecord') {
        newRequestNeeded = false;

        if (prevRequest.op !== 'removeRecord') {
          prevRequest = null;
          requests.pop();
        }
      } else if (
        prevRequest.op === 'addRecord' ||
        prevRequest.op === 'updateRecord'
      ) {
        if (operation.op === 'replaceAttribute') {
          newRequestNeeded = false;
          replaceRecordAttribute(
            prevRequest.record,
            operation.attribute,
            operation.value
          );
        } else if (operation.op === 'replaceRelatedRecord') {
          newRequestNeeded = false;
          replaceRecordHasOne(
            prevRequest.record,
            operation.relationship,
            operation.relatedRecord as RecordIdentity
          );
        } else if (operation.op === 'replaceRelatedRecords') {
          newRequestNeeded = false;
          replaceRecordHasMany(
            prevRequest.record,
            operation.relationship,
            operation.relatedRecords
          );
        }
      } else if (
        prevRequest.op === 'addToRelatedRecords' &&
        operation.op === 'addToRelatedRecords' &&
        (prevRequest as AddToRelatedRecordsRequest).relationship ===
          operation.relationship
      ) {
        newRequestNeeded = false;
        (prevRequest as AddToRelatedRecordsRequest).relatedRecords.push(
          cloneRecordIdentity(operation.relatedRecord)
        );
      } else if (
        prevRequest.op === 'removeFromRelatedRecords' &&
        operation.op === 'removeFromRelatedRecords' &&
        (prevRequest as RemoveFromRelatedRecordsRequest).relationship ===
          operation.relationship
      ) {
        newRequestNeeded = false;
        (prevRequest as RemoveFromRelatedRecordsRequest).relatedRecords.push(
          cloneRecordIdentity(operation.relatedRecord)
        );
      }
    }

    if (newRequestNeeded) {
      request = OperationToRequestMap[operation.op](operation);
    }

    if (request) {
      const options = requestProcessor.mergeRequestOptions([
        request.options,
        transform.options,
        operation.options
      ]);
      if (options) request.options = options;

      requests.push(request);
      prevRequest = request;
    }
  }

  return requests;
}

export interface OperationToRequestConverter {
  (operation: RecordOperation): RecordTransformRequest;
}

const OperationToRequestMap: Dict<OperationToRequestConverter> = {
  addRecord(operation: RecordOperation): RecordTransformRequest {
    const op = operation as AddRecordOperation;
    return {
      op: 'addRecord',
      record: clone(op.record)
    };
  },

  removeRecord(operation: RecordOperation): RecordTransformRequest {
    const op = operation as RemoveRecordOperation;
    return {
      op: 'removeRecord',
      record: cloneRecordIdentity(op.record)
    };
  },

  replaceAttribute(operation: RecordOperation): RecordTransformRequest {
    const op = operation as ReplaceAttributeOperation;
    const record = cloneRecordIdentity(op.record);

    replaceRecordAttribute(record, op.attribute, op.value);

    return {
      op: 'updateRecord',
      record
    };
  },

  updateRecord(operation: RecordOperation): RecordTransformRequest {
    return {
      op: 'updateRecord',
      record: clone(operation.record)
    };
  },

  addToRelatedRecords(operation: RecordOperation): RecordTransformRequest {
    const {
      record,
      relationship,
      relatedRecord
    } = operation as AddToRelatedRecordsOperation;
    return {
      op: 'addToRelatedRecords',
      record: cloneRecordIdentity(record),
      relationship,
      relatedRecords: [cloneRecordIdentity(relatedRecord)]
    } as AddToRelatedRecordsRequest;
  },

  removeFromRelatedRecords(operation: RecordOperation): RecordTransformRequest {
    const {
      record,
      relationship,
      relatedRecord
    } = operation as RemoveFromRelatedRecordsOperation;
    return {
      op: 'removeFromRelatedRecords',
      record: cloneRecordIdentity(record),
      relationship,
      relatedRecords: [cloneRecordIdentity(relatedRecord)]
    } as RemoveFromRelatedRecordsRequest;
  },

  replaceRelatedRecord(operation: RecordOperation): RecordTransformRequest {
    const record = cloneRecordIdentity(operation.record);
    const {
      relationship,
      relatedRecord
    } = operation as ReplaceRelatedRecordOperation;

    deepSet(record, ['relationships', relationship, 'data'], relatedRecord);

    return {
      op: 'updateRecord',
      record
    } as UpdateRecordRequest;
  },

  replaceRelatedRecords(operation: RecordOperation): RecordTransformRequest {
    const record = cloneRecordIdentity(operation.record);
    const {
      relationship,
      relatedRecords
    } = operation as ReplaceRelatedRecordsOperation;

    deepSet(record, ['relationships', relationship, 'data'], relatedRecords);

    return {
      op: 'updateRecord',
      record
    } as UpdateRecordRequest;
  }
};

function replaceRecordAttribute(
  record: RecordIdentity,
  attribute: string,
  value: any
) {
  deepSet(record, ['attributes', attribute], value);
}

function replaceRecordHasOne(
  record: RecordIdentity,
  relationship: string,
  relatedRecord: RecordIdentity
) {
  deepSet(
    record,
    ['relationships', relationship, 'data'],
    relatedRecord ? cloneRecordIdentity(relatedRecord) : null
  );
}

function replaceRecordHasMany(
  record: RecordIdentity,
  relationship: string,
  relatedRecords: RecordIdentity[]
) {
  deepSet(
    record,
    ['relationships', relationship, 'data'],
    relatedRecords.map((r) => cloneRecordIdentity(r))
  );
}

function handleChanges(
  record: InitializedRecord,
  recordDoc: RecordDocument,
  details: JSONAPIResponse
): TransformRequestProcessorResponse {
  let updatedRecord: InitializedRecord = recordDoc.data as InitializedRecord;
  let transforms: RecordTransform[] = [];
  let updateOps = recordDiffs(record, updatedRecord);
  if (updateOps.length > 0) {
    transforms.push(buildTransform(updateOps));
  }
  if (recordDoc.included && recordDoc.included.length > 0) {
    let includedOps = recordDoc.included.map((record) => {
      return { op: 'updateRecord', record } as RecordOperation;
    });
    transforms.push(buildTransform<RecordOperation>(includedOps));
  }
  return { transforms, data: updatedRecord, details };
}
