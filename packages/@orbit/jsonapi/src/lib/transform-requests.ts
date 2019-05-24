import Orbit, {
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
  UpdateRecordOperation,
  AddToRelatedRecordsOperation,
  RemoveFromRelatedRecordsOperation,
  ReplaceRelatedRecordOperation,
  ReplaceRelatedRecordsOperation,
  buildTransform
} from '@orbit/data';
import { clone, deepSet, Dict } from '@orbit/utils';
import JSONAPIRequestProcessor from '../jsonapi-request-processor';
import { ResourceDocument } from '../resource-document';
import { RecordDocument } from '../record-document';
import { RequestOptions } from './request-settings';

export interface TransformRecordRequest {
  op: string;
  options?: RequestOptions;
  record: RecordIdentity;
}

export interface TransformRecordRelationshipRequest extends TransformRecordRequest {
  relationship: string;
}

export interface AddRecordRequest extends TransformRecordRequest {
  op: 'addRecord';
  record: Record;
}

export interface RemoveRecordRequest extends TransformRecordRequest {
  op: 'removeRecord';
}

export interface UpdateRecordRequest extends TransformRecordRequest {
  op: 'updateRecord';
  record: Record;
}

export interface AddToRelatedRecordsRequest extends TransformRecordRelationshipRequest {
  op: 'addToRelatedRecords';
  relatedRecords: RecordIdentity[];
}

export interface RemoveFromRelatedRecordsRequest extends TransformRecordRelationshipRequest {
  op: 'removeFromRelatedRecords';
  relatedRecords: RecordIdentity[];
}

export interface ReplaceRelatedRecordRequest extends TransformRecordRelationshipRequest {
  op: 'replaceRelatedRecord';
  relatedRecord: RecordIdentity;
}

export interface ReplaceRelatedRecordsRequest extends TransformRecordRelationshipRequest {
  op: 'replaceRelatedRecord';
  relatedRecords: RecordIdentity[];
}

export interface TransformRequestProcessor {
  (requestProcessor: JSONAPIRequestProcessor, request: TransformRecordRequest): Promise<Transform[]>;
}

export const TransformRequestProcessors: Dict<TransformRequestProcessor> = {
  async addRecord(requestProcessor: JSONAPIRequestProcessor, request: AddRecordRequest): Promise<Transform[]> {
    const record = request.record;
    const requestDoc: ResourceDocument = requestProcessor.serializer.serialize({ data: record });
    const settings = requestProcessor.buildFetchSettings(request.options, { method: 'POST', json: requestDoc });

    let raw: ResourceDocument = await requestProcessor.fetch(requestProcessor.urlBuilder.resourceURL(record.type), settings);
    requestProcessor.preprocessResponseDocument(raw, request);
    let deserialized = requestProcessor.serializer.deserialize(raw, { primaryRecord: record });
    return handleChanges(record, deserialized);
  },

  async removeRecord(requestProcessor: JSONAPIRequestProcessor, request: RemoveRecordRequest): Promise<Transform[]> {
    const { type, id } = request.record;
    const settings = requestProcessor.buildFetchSettings(request.options, { method: 'DELETE' });

    await requestProcessor.fetch(requestProcessor.urlBuilder.resourceURL(type, id), settings);
    return [];
  },

  async updateRecord(requestProcessor: JSONAPIRequestProcessor, request: UpdateRecordRequest): Promise<Transform[]> {
    const record = request.record;
    const { type, id } = record;
    const requestDoc: ResourceDocument = requestProcessor.serializer.serialize({ data: record });
    const settings = requestProcessor.buildFetchSettings(request.options, { method: 'PATCH', json: requestDoc });

    let raw: ResourceDocument = await requestProcessor.fetch(requestProcessor.urlBuilder.resourceURL(type, id), settings)
    if (raw) {
      requestProcessor.preprocessResponseDocument(raw, request);
      let deserialized = requestProcessor.serializer.deserialize(raw, { primaryRecord: record })
      return handleChanges(record, deserialized);
    } else {
      return [];
    }
  },

  async addToRelatedRecords(requestProcessor: JSONAPIRequestProcessor, request: AddToRelatedRecordsRequest): Promise<Transform[]> {
    const { type, id } = request.record;
    const { relationship } = request;
    const json = {
      data: request.relatedRecords.map(r => requestProcessor.serializer.resourceIdentity(r))
    };
    const settings = requestProcessor.buildFetchSettings(request.options, { method: 'POST', json });

    await requestProcessor.fetch(requestProcessor.urlBuilder.resourceRelationshipURL(type, id, relationship), settings);
    return [];
  },

  async removeFromRelatedRecords(requestProcessor: JSONAPIRequestProcessor, request: RemoveFromRelatedRecordsRequest): Promise<Transform[]> {
    const { type, id } = request.record;
    const { relationship } = request;
    const json = {
      data: request.relatedRecords.map(r => requestProcessor.serializer.resourceIdentity(r))
    };
    const settings = requestProcessor.buildFetchSettings(request.options, { method: 'DELETE', json });

    await requestProcessor.fetch(requestProcessor.urlBuilder.resourceRelationshipURL(type, id, relationship), settings);
    return [];
  },

  async replaceRelatedRecord(requestProcessor: JSONAPIRequestProcessor, request: ReplaceRelatedRecordRequest): Promise<Transform[]> {
    const { type, id } = request.record;
    const { relationship, relatedRecord } = request;
    const json = {
      data: relatedRecord ? requestProcessor.serializer.resourceIdentity(relatedRecord) : null
    };
    const settings = requestProcessor.buildFetchSettings(request.options, { method: 'PATCH', json });

    await requestProcessor.fetch(requestProcessor.urlBuilder.resourceRelationshipURL(type, id, relationship), settings)
    return [];
  },

  async replaceRelatedRecords(requestProcessor: JSONAPIRequestProcessor, request: ReplaceRelatedRecordsRequest): Promise<Transform[]> {
    const { type, id } = request.record;
    const { relationship, relatedRecords } = request;
    const json = {
      data: relatedRecords.map(r => requestProcessor.serializer.resourceIdentity(r))
    };
    const settings = requestProcessor.buildFetchSettings(request.options, { method: 'PATCH', json });

    await requestProcessor.fetch(requestProcessor.urlBuilder.resourceRelationshipURL(type, id, relationship), settings);
    return [];
  }
};

export function getTransformRequests(requestProcessor: JSONAPIRequestProcessor, transform: Transform): TransformRecordRequest[] {
  const requests: TransformRecordRequest[] = [];
  let prevRequest: TransformRecordRequest;

  transform.operations.forEach((operation: RecordOperation) => {
    let request;
    let newRequestNeeded = true;

    if (prevRequest && equalRecordIdentities(prevRequest.record, operation.record)) {
      if (operation.op === 'removeRecord') {
        newRequestNeeded = false;

        if (prevRequest.op !== 'removeRecord') {
          prevRequest = null;
          requests.pop();
        }
      } else if (prevRequest.op === 'addRecord' || prevRequest.op === 'updateRecord') {
        if (operation.op === 'replaceAttribute') {
          newRequestNeeded = false;
          replaceRecordAttribute(prevRequest.record, operation.attribute, operation.value);
        } else if (operation.op === 'replaceRelatedRecord') {
          newRequestNeeded = false;
          replaceRecordHasOne(prevRequest.record, operation.relationship, operation.relatedRecord);
        } else if (operation.op === 'replaceRelatedRecords') {
          newRequestNeeded = false;
          replaceRecordHasMany(prevRequest.record, operation.relationship, operation.relatedRecords);
        }
      } else if (prevRequest.op === 'addToRelatedRecords' &&
                 operation.op === 'addToRelatedRecords' &&
                 (prevRequest as AddToRelatedRecordsRequest).relationship === operation.relationship) {
        newRequestNeeded = false;
        (prevRequest as AddToRelatedRecordsRequest).relatedRecords.push(cloneRecordIdentity(operation.relatedRecord));
      }
    }

    if (newRequestNeeded) {
      request = OperationToRequestMap[operation.op](operation);
    }

    if (request) {
      let options = requestProcessor.customRequestOptions(transform);
      if (options) {
        request.options = options;
      }
      requests.push(request);
      prevRequest = request;
    }
  });

  return requests;
}

export interface OperationToRequestConverter {
  (op: RecordOperation): TransformRecordRequest;
}

const OperationToRequestMap: Dict<OperationToRequestConverter> = {
  addRecord(operation: AddRecordOperation): TransformRecordRequest {
    return {
      op: 'addRecord',
      record: clone(operation.record)
    };
  },

  removeRecord(operation: RemoveRecordOperation): TransformRecordRequest {
    return {
      op: 'removeRecord',
      record: cloneRecordIdentity(operation.record)
    };
  },

  replaceAttribute(operation: ReplaceAttributeOperation): TransformRecordRequest {
    const record = cloneRecordIdentity(operation.record);

    replaceRecordAttribute(record, operation.attribute, operation.value);

    return {
      op: 'updateRecord',
      record
    };
  },

  updateRecord(operation: UpdateRecordOperation): TransformRecordRequest {
    return {
      op: 'updateRecord',
      record: clone(operation.record)
    };
  },

  replaceRecord(operation: UpdateRecordOperation): TransformRecordRequest {
    Orbit.deprecate('The `replaceRecord` operation has been deprecated - use `updateRecord` instead.');
    return {
      op: 'updateRecord',
      record: clone(operation.record)
    };
  },

  addToRelatedRecords(operation: AddToRelatedRecordsOperation): TransformRecordRequest {
    return {
      op: 'addToRelatedRecords',
      record: cloneRecordIdentity(operation.record),
      relationship: operation.relationship,
      relatedRecords: [cloneRecordIdentity(operation.relatedRecord)]
    } as AddToRelatedRecordsRequest;
  },

  removeFromRelatedRecords(operation: RemoveFromRelatedRecordsOperation): TransformRecordRequest {
    return {
      op: 'removeFromRelatedRecords',
      record: cloneRecordIdentity(operation.record),
      relationship: operation.relationship,
      relatedRecords: [cloneRecordIdentity(operation.relatedRecord)]
    } as RemoveFromRelatedRecordsRequest;
  },

  replaceRelatedRecord(operation: ReplaceRelatedRecordOperation): TransformRecordRequest {
    const record: Record = {
      type: operation.record.type,
      id: operation.record.id
    };

    deepSet(record, ['relationships', operation.relationship, 'data'], operation.relatedRecord);

    return {
      op: 'updateRecord',
      record
    } as UpdateRecordRequest;
  },

  replaceRelatedRecords(operation: ReplaceRelatedRecordsOperation): TransformRecordRequest {
    const record = cloneRecordIdentity(operation.record);
    deepSet(record, ['relationships', operation.relationship, 'data'], operation.relatedRecords);

    return {
      op: 'updateRecord',
      record
    } as UpdateRecordRequest;
  }
};

function replaceRecordAttribute(record: RecordIdentity, attribute: string, value: any) {
  deepSet(record, ['attributes', attribute], value);
}

function replaceRecordHasOne(record: RecordIdentity, relationship: string, relatedRecord: RecordIdentity) {
  deepSet(record, ['relationships', relationship, 'data'], relatedRecord ? cloneRecordIdentity(relatedRecord) : null);
}

function replaceRecordHasMany(record: RecordIdentity, relationship: string, relatedRecords: RecordIdentity[]) {
  deepSet(record, ['relationships', relationship, 'data'], relatedRecords.map(r => cloneRecordIdentity(r)));
}

function handleChanges(record: Record, responseDoc: RecordDocument): Transform[] {
  let updatedRecord: Record = <Record>responseDoc.data;
  let transforms = [];
  let updateOps = recordDiffs(record, updatedRecord);
  if (updateOps.length > 0) {
    transforms.push(buildTransform(updateOps));
  }
  if (responseDoc.included && responseDoc.included.length > 0) {
    let includedOps = responseDoc.included.map(record => {
      return { op: 'updateRecord', record };
    });
    transforms.push(buildTransform(includedOps));
  }
  return transforms;
}
