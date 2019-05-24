import { Dict, merge } from '@orbit/utils';
import {
  Query,
  ReplaceRelatedRecordOperation,
  ReplaceRelatedRecordsOperation,
  buildTransform,
  FindRecord,
  FindRecords,
  FindRelatedRecord,
  FindRelatedRecords,
  Record,
  Transform,
} from '@orbit/data';
import JSONAPIRequestProcessor from '../jsonapi-request-processor';
import { RequestOptions, mergeRequestOptions } from './request-settings';

export interface QueryOperatorResponse {
  transforms: Transform[];
  primaryData: Record|Record[];
}

export interface QueryOperator {
  (requestProcessor: JSONAPIRequestProcessor, query: Query): Promise<QueryOperatorResponse>;
}

export const QueryOperators: Dict<QueryOperator> = {
  async findRecord(requestProcessor: JSONAPIRequestProcessor, query: Query): Promise<QueryOperatorResponse> {
    const expression = query.expression as FindRecord;
    const { record } = expression;
    const requestOptions = requestProcessor.customRequestOptions(query);
    const settings = requestProcessor.buildFetchSettings(requestOptions);

    const document = await requestProcessor.fetch(requestProcessor.urlBuilder.resourceURL(record.type, record.id), settings);
    requestProcessor.preprocessResponseDocument(document, query);
    const deserialized = requestProcessor.serializer.deserialize(document);
    const operations = requestProcessor.operationsFromDeserializedDocument(deserialized);

    const transforms = [buildTransform(operations)];
    const primaryData = deserialized.data;

    return { transforms, primaryData };
  },

  async findRecords(requestProcessor: JSONAPIRequestProcessor, query: Query): Promise<QueryOperatorResponse> {
    const expression = query.expression as FindRecords;
    const { type } = expression;
    let { urlBuilder } = requestProcessor;
    let standardRequestOptions: RequestOptions = {};

    if (expression.filter) {
      standardRequestOptions.filter = await urlBuilder.buildFilterParam(expression.filter);
    }

    if (expression.sort) {
      standardRequestOptions.sort = await urlBuilder.buildSortParam(expression.sort);
    }

    if (expression.page) {
      standardRequestOptions.page = await urlBuilder.buildPageParam(expression.page);
    }

    let customOptions = requestProcessor.customRequestOptions(query);
    let requestOptions = standardRequestOptions;
    if (customOptions) {
      requestOptions = mergeRequestOptions(standardRequestOptions, customOptions);
    }

    const settings = requestProcessor.buildFetchSettings(requestOptions);

    const document = await requestProcessor.fetch(requestProcessor.urlBuilder.resourceURL(type), settings);
    requestProcessor.preprocessResponseDocument(document, query);
    const deserialized = requestProcessor.serializer.deserialize(document);
    const operations = requestProcessor.operationsFromDeserializedDocument(deserialized);

    const transforms = [buildTransform(operations)];
    const primaryData = deserialized.data;

    return { transforms, primaryData };
  },

  async findRelatedRecord(requestProcessor: JSONAPIRequestProcessor, query: Query): Promise<QueryOperatorResponse> {
    const expression = query.expression as FindRelatedRecord;
    const { record, relationship } = expression;
    const requestOptions = requestProcessor.customRequestOptions(query);
    const settings = requestProcessor.buildFetchSettings(requestOptions);

    const document = await requestProcessor.fetch(requestProcessor.urlBuilder.relatedResourceURL(record.type, record.id, relationship), settings);
    requestProcessor.preprocessResponseDocument(document, query);

    const deserialized = requestProcessor.serializer.deserialize(document);
    const relatedRecord = deserialized.data;
    const operations = requestProcessor.operationsFromDeserializedDocument(deserialized);
    operations.push({
      op: 'replaceRelatedRecord',
      record,
      relationship,
      relatedRecord
    } as ReplaceRelatedRecordOperation);

    const transforms = [buildTransform(operations)];
    const primaryData = relatedRecord;

    return { transforms, primaryData };
  },

  async findRelatedRecords(requestProcessor: JSONAPIRequestProcessor, query: Query): Promise<QueryOperatorResponse> {
    const expression = query.expression as FindRelatedRecords;
    const { record, relationship } = expression;
    let requestOptions = requestProcessor.customRequestOptions(query);
    const settings = requestProcessor.buildFetchSettings(requestOptions);

    const document = await requestProcessor.fetch(requestProcessor.urlBuilder.relatedResourceURL(record.type, record.id, relationship), settings);
    requestProcessor.preprocessResponseDocument(document, query);
    const deserialized = requestProcessor.serializer.deserialize(document);
    const relatedRecords = deserialized.data;

    const operations = requestProcessor.operationsFromDeserializedDocument(deserialized);
    operations.push({
      op: 'replaceRelatedRecords',
      record,
      relationship,
      relatedRecords
    } as ReplaceRelatedRecordsOperation);

    const transforms = [buildTransform(operations)];
    const primaryData = relatedRecords;

    return { transforms, primaryData };
  }
};
