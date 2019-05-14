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
import JSONAPISource from '../jsonapi-source';
import { RequestOptions } from './request-settings';

export interface QueryOperatorResponse {
  transforms: Transform[];
  primaryData: Record|Record[];
}

export interface QueryOperator {
  (source: JSONAPISource, query: Query): Promise<QueryOperatorResponse>;
}

export const QueryOperators: Dict<QueryOperator> = {
  async findRecord(source: JSONAPISource, query: Query): Promise<QueryOperatorResponse> {
    const expression = query.expression as FindRecord;
    const { record } = expression;
    const { requestProcessor } = source;
    const requestOptions = requestProcessor.customRequestOptions(query);
    const settings = requestProcessor.buildFetchSettings(requestOptions);

    const document = await requestProcessor.fetch(requestProcessor.resourceURL(record.type, record.id), settings);

    const deserialized = requestProcessor.serializer.deserialize(document);
    const operations = requestProcessor.operationsFromDeserializedDocument(deserialized);

    const transforms = [buildTransform(operations)];
    const primaryData = deserialized.data;

    return { transforms, primaryData };
  },

  async findRecords(source: JSONAPISource, query: Query): Promise<QueryOperatorResponse> {
    const expression = query.expression as FindRecords;
    const { type } = expression;
    const { requestProcessor } = source;

    let requestOptions: RequestOptions = {};

    if (expression.filter) {
      requestOptions.filter = requestProcessor.buildFilterParam(expression.filter);
    }

    if (expression.sort) {
      requestOptions.sort = requestProcessor.buildSortParam(expression.sort);
    }

    if (expression.page) {
      requestOptions.page = requestProcessor.buildPageParam(expression.page);
    }

    let customOptions = requestProcessor.customRequestOptions(query);
    if (customOptions) {
      merge(requestOptions, customOptions);
    }

    const settings = requestProcessor.buildFetchSettings(requestOptions);

    const document = await requestProcessor.fetch(requestProcessor.resourceURL(type), settings);

    const deserialized = requestProcessor.serializer.deserialize(document);
    const operations = requestProcessor.operationsFromDeserializedDocument(deserialized);

    const transforms = [buildTransform(operations)];
    const primaryData = deserialized.data;

    return { transforms, primaryData };
  },

  async findRelatedRecord(source: JSONAPISource, query: Query): Promise<QueryOperatorResponse> {
    const expression = query.expression as FindRelatedRecord;
    const { requestProcessor } = source;
    const { record, relationship } = expression;
    const requestOptions = requestProcessor.customRequestOptions(query);
    const settings = requestProcessor.buildFetchSettings(requestOptions);

    const document = await requestProcessor.fetch(requestProcessor.relatedResourceURL(record.type, record.id, relationship), settings);

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

  async findRelatedRecords(source: JSONAPISource, query: Query): Promise<QueryOperatorResponse> {
    const expression = query.expression as FindRelatedRecords;
    const { requestProcessor } = source;
    const { record, relationship } = expression;
    let requestOptions = requestProcessor.customRequestOptions(query);
    const settings = requestProcessor.buildFetchSettings(requestOptions);

    const document = await requestProcessor.fetch(requestProcessor.relatedResourceURL(record.type, record.id, relationship), settings);

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
