import { Dict, toArray, merge, clone } from '@orbit/utils';
import {
  Query,
  QueryExpressionParseError,
  Operation,
  ReplaceRelatedRecordOperation,
  ReplaceRelatedRecordsOperation,
  buildTransform,
  FindRecord,
  FindRecords,
  FindRelatedRecord,
  FindRelatedRecords,
  Record,
  Transform,
  FilterSpecifier,
  SortSpecifier,
  AttributeFilterSpecifier,
  RelatedRecordFilterSpecifier,
  AttributeSortSpecifier,
  RelatedRecordsFilterSpecifier,
  PageSpecifier
} from '@orbit/data';
import { RecordDocument } from '@orbit/jsonapi-serializer';

import JSONAPISource from '../jsonapi-source';
import { Filter, RequestOptions, buildFetchSettings, customRequestOptions } from './request-settings';

function operationsFromDeserializedDocument(deserialized: RecordDocument): Operation[] {
  const records: Record[] = [];
  Array.prototype.push.apply(records, toArray(deserialized.data));

  if (deserialized.included) {
    Array.prototype.push.apply(records, deserialized.included);
  }

  return records.map(record => {
    return {
      op: 'updateRecord',
      record
    };
  });
}

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
    const requestOptions = customRequestOptions(source, query);
    const settings = buildFetchSettings(requestOptions);

    const document = await source.fetch(source.resourceURL(record.type, record.id), settings);

    const deserialized = source.serializer.deserialize(document);
    const operations = operationsFromDeserializedDocument(deserialized);

    const transforms = [buildTransform(operations)];
    const primaryData = deserialized.data;

    return { transforms, primaryData };
  },

  async findRecords(source: JSONAPISource, query: Query): Promise<QueryOperatorResponse> {
    const expression = query.expression as FindRecords;
    const { type } = expression;

    let requestOptions: RequestOptions = {};

    if (expression.filter) {
      requestOptions.filter = buildFilterParam(source, expression.filter);
    }

    if (expression.sort) {
      requestOptions.sort = buildSortParam(source, expression.sort);
    }

    if (expression.page) {
      requestOptions.page = buildPageParam(source, expression.page);
    }

    let customOptions = customRequestOptions(source, query);
    if (customOptions) {
      merge(requestOptions, customOptions);
    }

    const settings = buildFetchSettings(requestOptions);

    const document = await source.fetch(source.resourceURL(type), settings);

    const deserialized = source.serializer.deserialize(document);
    const operations = operationsFromDeserializedDocument(deserialized);

    const transforms = [buildTransform(operations)];
    const primaryData = deserialized.data;

    return { transforms, primaryData };
  },

  async findRelatedRecord(source: JSONAPISource, query: Query): Promise<QueryOperatorResponse> {
    const expression = query.expression as FindRelatedRecord;
    const { record, relationship } = expression;
    const requestOptions = customRequestOptions(source, query);
    const settings = buildFetchSettings(requestOptions);

    const document = await source.fetch(source.relatedResourceURL(record.type, record.id, relationship), settings);

    const deserialized = source.serializer.deserialize(document);
    const relatedRecord = deserialized.data;
    const operations = operationsFromDeserializedDocument(deserialized);
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
    const { record, relationship } = expression;
    let requestOptions = customRequestOptions(source, query);
    const settings = buildFetchSettings(requestOptions);

    const document = await source.fetch(source.relatedResourceURL(record.type, record.id, relationship), settings);

    const deserialized = source.serializer.deserialize(document);
    const relatedRecords = deserialized.data;

    const operations = operationsFromDeserializedDocument(deserialized);
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

function buildFilterParam(source: JSONAPISource, filterSpecifiers: FilterSpecifier[]): Filter[] {
  const filters: Filter[] = [];

  filterSpecifiers.forEach(filterSpecifier => {
    if (filterSpecifier.kind === 'attribute' && filterSpecifier.op === 'equal') {
      const attributeFilter = filterSpecifier as AttributeFilterSpecifier;

      // Note: We don't know the `type` of the attribute here, so passing `null`
      const resourceAttribute = source.serializer.resourceAttribute(null, attributeFilter.attribute);
      filters.push({ [resourceAttribute]: attributeFilter.value });
    } else if (filterSpecifier.kind === 'relatedRecord') {
      const relatedRecordFilter = filterSpecifier as RelatedRecordFilterSpecifier;
      if (Array.isArray(relatedRecordFilter.record)) {
        filters.push({ [relatedRecordFilter.relation]: relatedRecordFilter.record.map(e => e.id).join(',') });
      } else {
        filters.push({ [relatedRecordFilter.relation]: relatedRecordFilter.record.id });
      }
    } else if (filterSpecifier.kind === 'relatedRecords') {
      if (filterSpecifier.op !== 'equal') {
        throw new Error(`Operation "${filterSpecifier.op}" is not supported in JSONAPI for relatedRecords filtering`);
      }
      const relatedRecordsFilter = filterSpecifier as RelatedRecordsFilterSpecifier;
      filters.push({ [relatedRecordsFilter.relation]: relatedRecordsFilter.records.map(e => e.id).join(',') });
    } else {
      throw new QueryExpressionParseError(`Filter operation ${filterSpecifier.op} not recognized for JSONAPISource.`, filterSpecifier);
    }
  });

  return filters;
}

function buildSortParam(source: JSONAPISource, sortSpecifiers: SortSpecifier[]): string {
  return sortSpecifiers.map(sortSpecifier => {
    if (sortSpecifier.kind === 'attribute') {
      const attributeSort = sortSpecifier as AttributeSortSpecifier;

      // Note: We don't know the `type` of the attribute here, so passing `null`
      const resourceAttribute = source.serializer.resourceAttribute(null, attributeSort.attribute);
      return (sortSpecifier.order === 'descending' ? '-' : '') + resourceAttribute;
    }
    throw new QueryExpressionParseError(`Sort specifier ${sortSpecifier.kind} not recognized for JSONAPISource.`, sortSpecifier);
  }).join(',');
}

function buildPageParam(source: JSONAPISource, pageSpecifier: PageSpecifier): object {
  let pageParam = clone(pageSpecifier);
  delete pageParam.kind;
  return pageParam;
}
