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
  Link
} from '@orbit/data';
import JSONAPIRequestProcessor from '../jsonapi-request-processor';
import { RequestOptions, mergeRequestOptions } from './request-settings';

export interface QueryOperatorResponse {
  transforms: Transform[];
  primaryData: Record | Record[];
  links?: Dict<Link>;
  meta?: Dict<any>;
}

export interface QueryOperator {
  (requestProcessor: JSONAPIRequestProcessor, query: Query): Promise<
    QueryOperatorResponse
  >;
}

export const QueryOperators: Dict<QueryOperator> = {
  async findRecord(
    requestProcessor: JSONAPIRequestProcessor,
    query: Query
  ): Promise<QueryOperatorResponse> {
    const expression = query.expression as FindRecord;
    const { record } = expression;
    const requestOptions = requestProcessor.customRequestOptions(query);
    const settings = requestProcessor.buildFetchSettings(requestOptions);

    const document = await requestProcessor.fetch(
      requestProcessor.urlBuilder.resourceURL(record.type, record.id),
      settings
    );
    requestProcessor.preprocessResponseDocument(document, query);
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
    query: Query
  ): Promise<QueryOperatorResponse> {
    const expression = query.expression as FindRecords;
    const { type } = expression;
    let { urlBuilder } = requestProcessor;
    let standardRequestOptions: RequestOptions = {};

    if (expression.filter) {
      standardRequestOptions.filter = await urlBuilder.buildFilterParam(
        expression.filter
      );
    }

    if (expression.sort) {
      standardRequestOptions.sort = await urlBuilder.buildSortParam(
        expression.sort
      );
    }

    if (expression.page) {
      standardRequestOptions.page = await urlBuilder.buildPageParam(
        expression.page
      );
    }

    let customOptions = requestProcessor.customRequestOptions(query);
    let requestOptions = standardRequestOptions;
    if (customOptions) {
      requestOptions = mergeRequestOptions(
        standardRequestOptions,
        customOptions
      );
    }

    const settings = requestProcessor.buildFetchSettings(requestOptions);

    const document = await requestProcessor.fetch(
      requestProcessor.urlBuilder.resourceURL(type),
      settings
    );
    requestProcessor.preprocessResponseDocument(document, query);
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
    query: Query
  ): Promise<QueryOperatorResponse> {
    const expression = query.expression as FindRelatedRecord;
    const { record, relationship } = expression;
    const requestOptions = requestProcessor.customRequestOptions(query);
    const settings = requestProcessor.buildFetchSettings(requestOptions);

    const document = await requestProcessor.fetch(
      requestProcessor.urlBuilder.relatedResourceURL(
        record.type,
        record.id,
        relationship
      ),
      settings
    );
    requestProcessor.preprocessResponseDocument(document, query);

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
    query: Query
  ): Promise<QueryOperatorResponse> {
    const expression = query.expression as FindRelatedRecords;
    const { record, relationship } = expression;
    const { urlBuilder } = requestProcessor;
    const standardRequestOptions: RequestOptions = {};
    const isFiltered = !!(
      expression.filter ||
      expression.sort ||
      expression.page
    );

    if (expression.filter) {
      standardRequestOptions.filter = await urlBuilder.buildFilterParam(
        expression.filter
      );
    }

    if (expression.sort) {
      standardRequestOptions.sort = await urlBuilder.buildSortParam(
        expression.sort
      );
    }

    if (expression.page) {
      standardRequestOptions.page = await urlBuilder.buildPageParam(
        expression.page
      );
    }

    const customOptions = requestProcessor.customRequestOptions(query);
    let requestOptions = standardRequestOptions;
    if (customOptions) {
      requestOptions = mergeRequestOptions(
        standardRequestOptions,
        customOptions
      );
    }

    const settings = requestProcessor.buildFetchSettings(requestOptions);

    const document = await requestProcessor.fetch(
      requestProcessor.urlBuilder.relatedResourceURL(
        record.type,
        record.id,
        relationship
      ),
      settings
    );
    requestProcessor.preprocessResponseDocument(document, query);
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
