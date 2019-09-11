import { Dict } from '@orbit/utils';
import {
  Query,
  AddToRelatedRecordsOperation,
  ReplaceRelatedRecordOperation,
  ReplaceRelatedRecordsOperation,
  buildTransform,
  FindRecord,
  FindRecords,
  FindRelatedRecord,
  FindRelatedRecords,
  Record,
  Transform,
  Link,
  QueryExpression,
  cloneRecordIdentity
} from '@orbit/data';
import JSONAPIRequestProcessor from '../jsonapi-request-processor';
import { RequestOptions, mergeRequestOptions } from './request-settings';

export interface QueryRequest {
  op: string;
  options?: RequestOptions;
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

export interface QueryRequestProcessor {
  (requestProcessor: JSONAPIRequestProcessor, request: QueryRequest): Promise<
    QueryProcessorResponse
  >;
}

export interface QueryProcessorResponse {
  transforms: Transform[];
  primaryData: Record | Record[];
  links?: Dict<Link>;
  meta?: Dict<any>;
}

export function getQueryRequests(
  requestProcessor: JSONAPIRequestProcessor,
  query: Query
): QueryRequest[] {
  const requests: QueryRequest[] = [];

  for (let expression of query.expressions) {
    let request = ExpressionToRequestMap[expression.op](
      expression,
      requestProcessor
    );
    let options = requestProcessor.customRequestOptions(query);

    if (options) {
      if (request.options) {
        request.options = mergeRequestOptions(request.options, options);
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
    expression: QueryExpression,
    requestProcessor: JSONAPIRequestProcessor
  ): QueryRequest;
}

const ExpressionToRequestMap: Dict<ExpressionToRequestConverter> = {
  findRecord(expression: FindRecord): FindRecordRequest {
    return {
      op: 'findRecord',
      record: cloneRecordIdentity(expression.record)
    };
  },
  findRecords(
    expression: FindRecords,
    requestProcessor: JSONAPIRequestProcessor
  ): FindRecordsRequest {
    let request: FindRecordsRequest = {
      op: 'findRecords',
      type: expression.type
    };
    let options: RequestOptions = {};

    if (expression.filter) {
      options.filter = requestProcessor.urlBuilder.buildFilterParam(
        expression.filter
      );
    }

    if (expression.sort) {
      options.sort = requestProcessor.urlBuilder.buildSortParam(
        expression.sort
      );
    }

    if (expression.page) {
      options.page = requestProcessor.urlBuilder.buildPageParam(
        expression.page
      );
    }

    request.options = options;

    return request;
  },
  findRelatedRecord(expression: FindRelatedRecord): FindRelatedRecordRequest {
    return {
      op: 'findRelatedRecord',
      record: cloneRecordIdentity(expression.record),
      relationship: expression.relationship
    };
  },
  findRelatedRecords(
    expression: FindRelatedRecords,
    requestProcessor: JSONAPIRequestProcessor
  ): FindRelatedRecordsRequest {
    const request: FindRelatedRecordsRequest = {
      op: 'findRelatedRecords',
      record: cloneRecordIdentity(expression.record),
      relationship: expression.relationship
    };
    const options: RequestOptions = {};

    if (expression.filter) {
      options.filter = requestProcessor.urlBuilder.buildFilterParam(
        expression.filter
      );
    }

    if (expression.sort) {
      options.sort = requestProcessor.urlBuilder.buildSortParam(
        expression.sort
      );
    }

    if (expression.page) {
      options.page = requestProcessor.urlBuilder.buildPageParam(
        expression.page
      );
    }

    request.options = options;

    return request;
  }
};

export const QueryRequestProcessors: Dict<QueryRequestProcessor> = {
  async findRecord(
    requestProcessor: JSONAPIRequestProcessor,
    request: FindRecordRequest
  ): Promise<QueryProcessorResponse> {
    const { record } = request;

    const settings = requestProcessor.buildFetchSettings(request.options);
    const document = await requestProcessor.fetch(
      requestProcessor.urlBuilder.resourceURL(record.type, record.id),
      settings
    );
    requestProcessor.preprocessResponseDocument(document, request);

    const deserialized = requestProcessor.serializer.deserialize(document);
    const operations = requestProcessor.operationsFromDeserializedDocument(
      deserialized
    );

    const transforms = [buildTransform(operations)];
    const { data: primaryData, meta, links } = deserialized;

    return { transforms, primaryData, meta, links };
  },

  async findRecords(
    requestProcessor: JSONAPIRequestProcessor,
    request: FindRecordsRequest
  ): Promise<QueryProcessorResponse> {
    const { type } = request;

    const settings = requestProcessor.buildFetchSettings(request.options);
    const document = await requestProcessor.fetch(
      requestProcessor.urlBuilder.resourceURL(type),
      settings
    );
    requestProcessor.preprocessResponseDocument(document, request);

    const deserialized = requestProcessor.serializer.deserialize(document);
    const operations = requestProcessor.operationsFromDeserializedDocument(
      deserialized
    );

    const transforms = [buildTransform(operations)];
    const { data: primaryData, meta, links } = deserialized;

    return { transforms, primaryData, meta, links };
  },

  async findRelatedRecord(
    requestProcessor: JSONAPIRequestProcessor,
    request: FindRelatedRecordRequest
  ): Promise<QueryProcessorResponse> {
    const { record, relationship } = request;

    const settings = requestProcessor.buildFetchSettings(request.options);
    const document = await requestProcessor.fetch(
      requestProcessor.urlBuilder.relatedResourceURL(
        record.type,
        record.id,
        relationship
      ),
      settings
    );
    requestProcessor.preprocessResponseDocument(document, request);

    const deserialized = requestProcessor.serializer.deserialize(document);
    const { data: relatedRecord, meta, links } = deserialized;
    const operations = requestProcessor.operationsFromDeserializedDocument(
      deserialized
    );
    operations.push({
      op: 'replaceRelatedRecord',
      record,
      relationship,
      relatedRecord
    } as ReplaceRelatedRecordOperation);

    const transforms = [buildTransform(operations)];
    const primaryData = relatedRecord;

    return { transforms, primaryData, meta, links };
  },

  async findRelatedRecords(
    requestProcessor: JSONAPIRequestProcessor,
    request: FindRelatedRecordsRequest
  ): Promise<QueryProcessorResponse> {
    const { record, relationship } = request;
    const isFiltered = !!(
      request.options.filter ||
      request.options.sort ||
      request.options.page
    );

    const settings = requestProcessor.buildFetchSettings(request.options);
    const document = await requestProcessor.fetch(
      requestProcessor.urlBuilder.relatedResourceURL(
        record.type,
        record.id,
        relationship
      ),
      settings
    );
    requestProcessor.preprocessResponseDocument(document, request);

    const deserialized = requestProcessor.serializer.deserialize(document);
    const { data, meta, links } = deserialized;
    const relatedRecords = data as Record[];

    const operations = requestProcessor.operationsFromDeserializedDocument(
      deserialized
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
    const primaryData = relatedRecords;

    return { transforms, primaryData, meta, links };
  }
};
