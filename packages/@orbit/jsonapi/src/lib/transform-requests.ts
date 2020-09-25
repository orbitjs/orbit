import {
  cloneRecordIdentity,
  equalRecordIdentities,
  recordDiffs,
  Record,
  RecordIdentity,
  RecordOperation,
  Transform,
  AddRecordOperation,
  RemoveRecordOperation,
  ReplaceAttributeOperation,
  AddToRelatedRecordsOperation,
  RemoveFromRelatedRecordsOperation,
  ReplaceRelatedRecordOperation,
  ReplaceRelatedRecordsOperation,
  buildTransform,
  Link
} from '@orbit/data';
import { clone, deepSet, Dict } from '@orbit/utils';
import { JSONAPIRequestProcessor } from '../jsonapi-request-processor';
import {
  ResourceDocument,
  RecordDocument,
  PrimaryRecordData
} from '../resources';
import { JSONAPIRequestOptions } from './jsonapi-request-options';
import { JSONAPISerializers } from '../serializers/jsonapi-serializers';
import { JSONAPIDocumentSerializer } from '../serializers/jsonapi-document-serializer';
import { JSONAPIResourceIdentitySerializer } from '../serializers/jsonapi-resource-identity-serializer';

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
  record: Record;
}

export interface RemoveRecordRequest extends BaseTransformRecordRequest {
  op: 'removeRecord';
}

export interface UpdateRecordRequest extends BaseTransformRecordRequest {
  op: 'updateRecord';
  record: Record;
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

export type TransformRecordRequest =
  | AddRecordRequest
  | RemoveRecordRequest
  | UpdateRecordRequest
  | AddToRelatedRecordsRequest
  | RemoveFromRelatedRecordsRequest
  | ReplaceRelatedRecordRequest
  | ReplaceRelatedRecordsRequest;

export interface TransformRequestProcessor {
  (
    requestProcessor: JSONAPIRequestProcessor,
    request: TransformRecordRequest
  ): Promise<RequestProcessorResponse>;
}

export interface RequestProcessorResponse {
  transforms: Transform[];
  primaryData: PrimaryRecordData;
  links?: Dict<Link>;
  meta?: Dict<any>;
}

export const TransformRequestProcessors: Dict<TransformRequestProcessor> = {
  async addRecord(
    requestProcessor: JSONAPIRequestProcessor,
    request: TransformRecordRequest
  ): Promise<RequestProcessorResponse> {
    const { record } = request as AddRecordRequest;
    const options = request.options || {};
    const serializer = requestProcessor.serializerFor(
      JSONAPISerializers.ResourceDocument
    ) as JSONAPIDocumentSerializer;
    const requestDoc = serializer.serialize({
      data: record
    }) as ResourceDocument;
    const settings = requestProcessor.buildFetchSettings(options, {
      method: 'POST',
      json: requestDoc
    });
    const url =
      options.url || requestProcessor.urlBuilder.resourceURL(record.type);

    const raw: ResourceDocument = await requestProcessor.fetch(url, settings);
    requestProcessor.preprocessResponseDocument(raw, request);
    const deserialized = serializer.deserialize(raw, {
      primaryRecord: record
    }) as RecordDocument;
    return handleChanges(record, deserialized);
  },

  async removeRecord(
    requestProcessor: JSONAPIRequestProcessor,
    request: TransformRecordRequest
  ): Promise<RequestProcessorResponse> {
    const { record } = request as RemoveRecordRequest;
    const options = request.options || {};
    const { type, id } = record;
    const settings = requestProcessor.buildFetchSettings(options, {
      method: 'DELETE'
    });
    const url =
      options.url || requestProcessor.urlBuilder.resourceURL(type, id);

    await requestProcessor.fetch(url, settings);
    return { transforms: [], primaryData: record };
  },

  async updateRecord(
    requestProcessor: JSONAPIRequestProcessor,
    request: TransformRecordRequest
  ): Promise<RequestProcessorResponse> {
    const { record } = request as UpdateRecordRequest;
    const options = request.options || {};
    const { type, id } = record;
    const serializer = requestProcessor.serializerFor(
      JSONAPISerializers.ResourceDocument
    ) as JSONAPIDocumentSerializer;
    const requestDoc = serializer.serialize({
      data: record
    }) as ResourceDocument;
    const settings = requestProcessor.buildFetchSettings(options, {
      method: 'PATCH',
      json: requestDoc
    });
    const url =
      options.url || requestProcessor.urlBuilder.resourceURL(type, id);

    const raw: ResourceDocument = await requestProcessor.fetch(url, settings);
    if (raw) {
      requestProcessor.preprocessResponseDocument(raw, request);
      const deserialized = serializer.deserialize(raw, {
        primaryRecord: record
      }) as RecordDocument;
      return handleChanges(record, deserialized);
    } else {
      return { transforms: [], primaryData: record };
    }
  },

  async addToRelatedRecords(
    requestProcessor: JSONAPIRequestProcessor,
    request: TransformRecordRequest
  ): Promise<RequestProcessorResponse> {
    const {
      relationship,
      record,
      relatedRecords
    } = request as AddToRelatedRecordsRequest;
    const options = request.options || {};
    const { type, id } = record;
    const resourceIdentitySerializer = requestProcessor.serializerFor(
      JSONAPISerializers.ResourceIdentity
    ) as JSONAPIResourceIdentitySerializer;
    const json = {
      data: relatedRecords.map((r) => resourceIdentitySerializer.serialize(r))
    };
    const settings = requestProcessor.buildFetchSettings(options, {
      method: 'POST',
      json
    });
    const url =
      options.url ||
      requestProcessor.urlBuilder.resourceRelationshipURL(
        type,
        id,
        relationship
      );

    await requestProcessor.fetch(url, settings);
    return { transforms: [], primaryData: record };
  },

  async removeFromRelatedRecords(
    requestProcessor: JSONAPIRequestProcessor,
    request: TransformRecordRequest
  ): Promise<RequestProcessorResponse> {
    const {
      relationship,
      record,
      relatedRecords
    } = request as RemoveFromRelatedRecordsRequest;
    const options = request.options || {};
    const { type, id } = record;
    const resourceIdentitySerializer = requestProcessor.serializerFor(
      JSONAPISerializers.ResourceIdentity
    ) as JSONAPIResourceIdentitySerializer;
    const json = {
      data: relatedRecords.map((r) => resourceIdentitySerializer.serialize(r))
    };
    const settings = requestProcessor.buildFetchSettings(options, {
      method: 'DELETE',
      json
    });
    const url =
      options.url ||
      requestProcessor.urlBuilder.resourceRelationshipURL(
        type,
        id,
        relationship
      );

    await requestProcessor.fetch(url, settings);
    return { transforms: [], primaryData: record };
  },

  async replaceRelatedRecord(
    requestProcessor: JSONAPIRequestProcessor,
    request: TransformRecordRequest
  ): Promise<RequestProcessorResponse> {
    const {
      relationship,
      relatedRecord,
      record
    } = request as ReplaceRelatedRecordRequest;
    const options = request.options || {};
    const { type, id } = record;
    const resourceIdentitySerializer = requestProcessor.serializerFor(
      JSONAPISerializers.ResourceIdentity
    ) as JSONAPIResourceIdentitySerializer;
    const json = {
      data: relatedRecord
        ? resourceIdentitySerializer.serialize(relatedRecord)
        : null
    };
    const settings = requestProcessor.buildFetchSettings(options, {
      method: 'PATCH',
      json
    });
    const url =
      options.url ||
      requestProcessor.urlBuilder.resourceRelationshipURL(
        type,
        id,
        relationship
      );

    await requestProcessor.fetch(url, settings);
    return { transforms: [], primaryData: record };
  },

  async replaceRelatedRecords(
    requestProcessor: JSONAPIRequestProcessor,
    request: TransformRecordRequest
  ): Promise<RequestProcessorResponse> {
    const {
      relationship,
      relatedRecords,
      record
    } = request as ReplaceRelatedRecordsRequest;
    const options = request.options || {};
    const { type, id } = record;
    const resourceIdentitySerializer = requestProcessor.serializerFor(
      JSONAPISerializers.ResourceIdentity
    ) as JSONAPIResourceIdentitySerializer;
    const json = {
      data: relatedRecords.map((r) => resourceIdentitySerializer.serialize(r))
    };
    const settings = requestProcessor.buildFetchSettings(options, {
      method: 'PATCH',
      json
    });
    const url =
      options.url ||
      requestProcessor.urlBuilder.resourceRelationshipURL(
        type,
        id,
        relationship
      );

    await requestProcessor.fetch(url, settings);
    return { transforms: [], primaryData: record };
  }
};

export function getTransformRequests(
  requestProcessor: JSONAPIRequestProcessor,
  transform: Transform
): TransformRecordRequest[] {
  const requests: TransformRecordRequest[] = [];
  let prevRequest: TransformRecordRequest | null;

  (transform.operations as RecordOperation[]).forEach(
    (operation: RecordOperation) => {
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
        }
      }

      if (newRequestNeeded) {
        request = OperationToRequestMap[operation.op](operation);
      }

      if (request) {
        let options = requestProcessor.customRequestOptions(
          transform,
          operation
        );
        if (options) {
          request.options = options;
        }
        requests.push(request);
        prevRequest = request;
      }
    }
  );

  return requests;
}

export interface OperationToRequestConverter {
  (operation: RecordOperation): TransformRecordRequest;
}

const OperationToRequestMap: Dict<OperationToRequestConverter> = {
  addRecord(operation: RecordOperation): TransformRecordRequest {
    const op = operation as AddRecordOperation;
    return {
      op: 'addRecord',
      record: clone(op.record)
    };
  },

  removeRecord(operation: RecordOperation): TransformRecordRequest {
    const op = operation as RemoveRecordOperation;
    return {
      op: 'removeRecord',
      record: cloneRecordIdentity(op.record)
    };
  },

  replaceAttribute(operation: RecordOperation): TransformRecordRequest {
    const op = operation as ReplaceAttributeOperation;
    const record = cloneRecordIdentity(op.record);

    replaceRecordAttribute(record, op.attribute, op.value);

    return {
      op: 'updateRecord',
      record
    };
  },

  updateRecord(operation: RecordOperation): TransformRecordRequest {
    return {
      op: 'updateRecord',
      record: clone(operation.record)
    };
  },

  addToRelatedRecords(operation: RecordOperation): TransformRecordRequest {
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

  removeFromRelatedRecords(operation: RecordOperation): TransformRecordRequest {
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

  replaceRelatedRecord(operation: RecordOperation): TransformRecordRequest {
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

  replaceRelatedRecords(operation: RecordOperation): TransformRecordRequest {
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
  record: Record,
  responseDoc: RecordDocument
): RequestProcessorResponse {
  let updatedRecord: Record = responseDoc.data as Record;
  let { meta, links } = responseDoc;
  let transforms = [];
  let updateOps = recordDiffs(record, updatedRecord);
  if (updateOps.length > 0) {
    transforms.push(buildTransform(updateOps));
  }
  if (responseDoc.included && responseDoc.included.length > 0) {
    let includedOps = responseDoc.included.map((record) => {
      return { op: 'updateRecord', record };
    });
    transforms.push(buildTransform(includedOps));
  }
  return { transforms, primaryData: updatedRecord, meta, links };
}
