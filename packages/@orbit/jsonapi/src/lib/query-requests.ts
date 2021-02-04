import { Dict } from '@orbit/utils';
import {
  RecordQuery,
  AddToRelatedRecordsOperation,
  ReplaceRelatedRecordOperation,
  ReplaceRelatedRecordsOperation,
  FindRecord,
  FindRecords,
  FindRelatedRecord,
  FindRelatedRecords,
  Record,
  RecordQueryExpression,
  cloneRecordIdentity,
  RecordOperation,
  RecordQueryExpressionResult,
  RecordNotFoundException
} from '@orbit/records';
import { buildTransform, FullResponse } from '@orbit/data';
import { JSONAPIRequestProcessor } from '../jsonapi-request-processor';
import {
  JSONAPIRequestOptions,
  mergeJSONAPIRequestOptions
} from './jsonapi-request-options';
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
  record: Record;
}

export interface FindRecordsRequest extends QueryRequest {
  op: 'findRecords';
  type: string;
}

export interface FindRelatedRecordRequest extends QueryRequest {
  op: 'findRelatedRecord';
  record: Record;
  relationship: string;
}

export interface FindRelatedRecordsRequest extends QueryRequest {
  op: 'findRelatedRecords';
  record: Record;
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

  for (let expression of query.expressions) {
    let request = ExpressionToRequestMap[expression.op](
      expression as RecordQueryExpression,
      requestProcessor
    );

    let options = requestProcessor.customRequestOptions(query, expression);
    if (options) {
      if (request.options) {
        request.options = mergeJSONAPIRequestOptions(request.options, options);
      } else {
        request.options = options;
      }
    }

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
  findRecords(
    expression: RecordQueryExpression,
    requestProcessor: JSONAPIRequestProcessor
  ): FindRecordsRequest {
    const exp = expression as FindRecords;
    let request: FindRecordsRequest = {
      op: 'findRecords',
      type: exp.type as string
    };
    let options: JSONAPIRequestOptions = {};

    if (exp.filter) {
      options.filter = requestProcessor.urlBuilder.buildFilterParam(exp.filter);
    }

    if (exp.sort) {
      options.sort = requestProcessor.urlBuilder.buildSortParam(exp.sort);
    }

    if (exp.page) {
      options.page = requestProcessor.urlBuilder.buildPageParam(exp.page);
    }

    request.options = options;

    return request;
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
    expression: RecordQueryExpression,
    requestProcessor: JSONAPIRequestProcessor
  ): FindRelatedRecordsRequest {
    const exp = expression as FindRelatedRecords;
    const request: FindRelatedRecordsRequest = {
      op: 'findRelatedRecords',
      record: cloneRecordIdentity(exp.record),
      relationship: exp.relationship
    };
    const options: JSONAPIRequestOptions = {};

    if (exp.filter) {
      options.filter = requestProcessor.urlBuilder.buildFilterParam(exp.filter);
    }

    if (exp.sort) {
      options.sort = requestProcessor.urlBuilder.buildSortParam(exp.sort);
    }

    if (exp.page) {
      options.page = requestProcessor.urlBuilder.buildPageParam(exp.page);
    }

    request.options = options;

    return request;
  }
};

export const QueryRequestProcessors: Dict<QueryRequestProcessor> = {
  async findRecord(
    requestProcessor: JSONAPIRequestProcessor,
    request: RecordQueryRequest
  ): Promise<QueryRequestProcessorResponse> {
    const { record } = request as FindRecordRequest;
    const options = request.options || {};
    const settings = requestProcessor.buildFetchSettings(options);
    const url =
      options.url ||
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
      if (options?.raiseNotFoundExceptions) {
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
    const options = request.options || {};
    const settings = requestProcessor.buildFetchSettings(options);
    const url = options.url || requestProcessor.urlBuilder.resourceURL(type);

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
    const options = request.options || {};
    const settings = requestProcessor.buildFetchSettings(options);
    const url =
      options.url ||
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
      if (options?.raiseNotFoundExceptions) {
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
    const options = request.options || {};
    const isFiltered = !!(options.filter || options.sort || options.page);
    const settings = requestProcessor.buildFetchSettings(options);
    const url =
      options.url ||
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
      const relatedRecords = recordDoc.data as Record[];
      const operations = requestProcessor.operationsFromDeserializedDocument(
        recordDoc
      );
      if (isFiltered) {
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
      if (options?.raiseNotFoundExceptions) {
        throw new RecordNotFoundException(record.type, record.id);
      }
      return { transforms: [] };
    }
  }
};
