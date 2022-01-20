import { Dict, toArray } from '@orbit/utils';
import {
  RecordQuery,
  AddToRelatedRecordsOperation,
  ReplaceRelatedRecordOperation,
  ReplaceRelatedRecordsOperation,
  FindRecord,
  FindRecords,
  FindRelatedRecord,
  FindRelatedRecords,
  RecordIdentity,
  RecordQueryExpression,
  cloneRecordIdentity,
  RecordOperation,
  RecordQueryExpressionResult,
  RecordNotFoundException
} from '@orbit/records';
import { buildTransform, FullResponse } from '@orbit/data';
import { JSONAPIRequestProcessor } from '../jsonapi-request-processor';
import { JSONAPIRequestOptions } from './jsonapi-request-options';
import { JSONAPISerializers } from '../serializers/jsonapi-serializers';
import { JSONAPIDocumentSerializer } from '../serializers/jsonapi-document-serializer';
import { RecordDocument } from '../record-document';
import { JSONAPIResponse } from '../jsonapi-response';

export interface QueryRequest {
  op: string;
  options?: JSONAPIRequestOptions;
}

export interface FindRecordRequest extends QueryRequest {
  op: 'findRecord';
  record: RecordIdentity;
}

export interface FindRecordsRequest extends QueryRequest {
  op: 'findRecords';
  type: string;
}

export interface FindRelatedRecordRequest extends QueryRequest {
  op: 'findRelatedRecord';
  record: RecordIdentity;
  relationship: string;
}

export interface FindRelatedRecordsRequest extends QueryRequest {
  op: 'findRelatedRecords';
  record: RecordIdentity;
  relationship: string;
}

export type RecordQueryRequest =
  | FindRecordRequest
  | FindRecordsRequest
  | FindRelatedRecordRequest
  | FindRelatedRecordsRequest;

export type QueryRequestProcessorResponse = FullResponse<
  RecordQueryExpressionResult,
  JSONAPIResponse,
  RecordOperation
>;

export interface QueryRequestProcessor {
  (
    requestProcessor: JSONAPIRequestProcessor,
    request: RecordQueryRequest
  ): Promise<QueryRequestProcessorResponse>;
}

export function getQueryRequests(
  requestProcessor: JSONAPIRequestProcessor,
  query: RecordQuery
): RecordQueryRequest[] {
  const requests: RecordQueryRequest[] = [];

  for (let expression of toArray(query.expressions)) {
    const request = ExpressionToRequestMap[expression.op](
      expression as RecordQueryExpression,
      requestProcessor
    );

    const options = requestProcessor.mergeRequestOptions([
      request.options,
      query.options,
      expression.options
    ]);
    if (options) request.options = options;

    requests.push(request);
  }
  return requests;
}

export interface ExpressionToRequestConverter {
  (
    expression: RecordQueryExpression,
    requestProcessor: JSONAPIRequestProcessor
  ): RecordQueryRequest;
}

const ExpressionToRequestMap: Dict<ExpressionToRequestConverter> = {
  findRecord(expression: RecordQueryExpression): FindRecordRequest {
    const exp = expression as FindRecord;
    return {
      op: 'findRecord',
      record: cloneRecordIdentity(exp.record)
    };
  },
  findRecords(expression: RecordQueryExpression): FindRecordsRequest {
    const exp = expression as FindRecords;
    const { filter, sort, page } = exp;
    return {
      op: 'findRecords',
      type: exp.type as string,
      options: { filter, sort, page }
    };
  },
  findRelatedRecord(
    expression: RecordQueryExpression
  ): FindRelatedRecordRequest {
    const exp = expression as FindRelatedRecord;
    return {
      op: 'findRelatedRecord',
      record: cloneRecordIdentity(exp.record),
      relationship: exp.relationship
    };
  },
  findRelatedRecords(
    expression: RecordQueryExpression
  ): FindRelatedRecordsRequest {
    const exp = expression as FindRelatedRecords;
    const { filter, sort, page } = exp;
    return {
      op: 'findRelatedRecords',
      record: cloneRecordIdentity(exp.record),
      relationship: exp.relationship,
      options: { filter, sort, page }
    };
  }
};

export const QueryRequestProcessors: Dict<QueryRequestProcessor> = {
  async findRecord(
    requestProcessor: JSONAPIRequestProcessor,
    request: RecordQueryRequest
  ): Promise<QueryRequestProcessorResponse> {
    const { record } = request as FindRecordRequest;
    const settings = requestProcessor.buildFetchSettings(request);
    const url =
      request.options?.url ??
      requestProcessor.urlBuilder.resourceURL(record.type, record.id);

    const details = await requestProcessor.fetch(url, settings);
    const { document } = details;
    requestProcessor.preprocessResponseDocument(document, request);

    if (document) {
      const serializer = requestProcessor.serializerFor(
        JSONAPISerializers.ResourceDocument
      ) as JSONAPIDocumentSerializer;
      const recordDoc = serializer.deserialize(document) as RecordDocument;
      const operations = requestProcessor.operationsFromDeserializedDocument(
        recordDoc
      );
      const transforms = [buildTransform<RecordOperation>(operations)];

      return { transforms, data: recordDoc.data, details };
    } else {
      if (request.options?.raiseNotFoundExceptions) {
        throw new RecordNotFoundException(record.type, record.id);
      }
      return { transforms: [] };
    }
  },

  async findRecords(
    requestProcessor: JSONAPIRequestProcessor,
    request: RecordQueryRequest
  ): Promise<QueryRequestProcessorResponse> {
    const { type } = request as FindRecordsRequest;
    const settings = requestProcessor.buildFetchSettings(request);
    const url =
      request.options?.url ?? requestProcessor.urlBuilder.resourceURL(type);

    const details = await requestProcessor.fetch(url, settings);
    const { document } = details;
    requestProcessor.preprocessResponseDocument(document, request);

    if (document) {
      const serializer = requestProcessor.serializerFor(
        JSONAPISerializers.ResourceDocument
      ) as JSONAPIDocumentSerializer;
      const recordDoc = serializer.deserialize(document) as RecordDocument;
      const operations = requestProcessor.operationsFromDeserializedDocument(
        recordDoc
      );
      const transforms = [buildTransform(operations)];

      return { transforms, data: recordDoc.data, details };
    } else {
      return { transforms: [] };
    }
  },

  async findRelatedRecord(
    requestProcessor: JSONAPIRequestProcessor,
    request: RecordQueryRequest
  ): Promise<QueryRequestProcessorResponse> {
    const { record, relationship } = request as FindRelatedRecordRequest;
    const settings = requestProcessor.buildFetchSettings(request);
    const url =
      request.options?.url ??
      requestProcessor.urlBuilder.relatedResourceURL(
        record.type,
        record.id,
        relationship
      );

    const details = await requestProcessor.fetch(url, settings);
    const { document } = details;
    requestProcessor.preprocessResponseDocument(document, request);

    if (document) {
      const serializer = requestProcessor.serializerFor(
        JSONAPISerializers.ResourceDocument
      ) as JSONAPIDocumentSerializer;
      const recordDoc = serializer.deserialize(document) as RecordDocument;
      const relatedRecord = recordDoc.data;
      const operations = requestProcessor.operationsFromDeserializedDocument(
        recordDoc
      );
      operations.push({
        op: 'replaceRelatedRecord',
        record,
        relationship,
        relatedRecord
      } as ReplaceRelatedRecordOperation);
      const transforms = [buildTransform(operations)];

      return { transforms, data: relatedRecord, details };
    } else {
      if (request.options?.raiseNotFoundExceptions) {
        throw new RecordNotFoundException(record.type, record.id);
      }
      return { transforms: [] };
    }
  },

  async findRelatedRecords(
    requestProcessor: JSONAPIRequestProcessor,
    request: RecordQueryRequest
  ): Promise<QueryRequestProcessorResponse> {
    const { record, relationship } = request as FindRelatedRecordsRequest;
    const settings = requestProcessor.buildFetchSettings(request);
    const url =
      request.options?.url ??
      requestProcessor.urlBuilder.relatedResourceURL(
        record.type,
        record.id,
        relationship
      );

    const details = await requestProcessor.fetch(url, settings);
    const { document } = details;
    requestProcessor.preprocessResponseDocument(document, request);

    if (document) {
      const serializer = requestProcessor.serializerFor(
        JSONAPISerializers.ResourceDocument
      ) as JSONAPIDocumentSerializer;
      const recordDoc = serializer.deserialize(document) as RecordDocument;
      const relatedRecords = recordDoc.data as RecordIdentity[];
      const operations = requestProcessor.operationsFromDeserializedDocument(
        recordDoc
      );

      const partialSet =
        request.options?.partialSet ??
        !!(
          request.options?.filter ||
          request.options?.page ||
          recordDoc.links?.next ||
          recordDoc.links?.prev
        );

      if (partialSet) {
        for (let relatedRecord of relatedRecords) {
          operations.push({
            op: 'addToRelatedRecords',
            record,
            relationship,
            relatedRecord
          } as AddToRelatedRecordsOperation);
        }
      } else {
        operations.push({
          op: 'replaceRelatedRecords',
          record,
          relationship,
          relatedRecords
        } as ReplaceRelatedRecordsOperation);
      }
      const transforms = [buildTransform(operations)];

      return { transforms, data: relatedRecords, details };
    } else {
      if (request.options?.raiseNotFoundExceptions) {
        throw new RecordNotFoundException(record.type, record.id);
      }
      return { transforms: [] };
    }
  }
};
