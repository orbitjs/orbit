import { Dict, toArray, merge, deepGet } from '@orbit/utils';
import {
  Query,
  QueryExpression,
  QueryExpressionParseError,
  Transform,
  FindRecord,
  FindRecords,
  FindRelatedRecord,
  FindRelatedRecords,
  FilterSpecifier,
  SortSpecifier,
  AttributeFilterSpecifier,
  AttributeSortSpecifier,
  buildTransform,
  Record,
  RecordRelationship,
  LinkObject
} from '@orbit/data';
import JSONAPISource, { FetchSettings } from '../jsonapi-source';
import { DeserializedDocument } from '../jsonapi-serializer';
import { JSONAPIDocument, ResourceRelationship } from '../jsonapi-document';
import { RequestOptions, buildFetchSettings } from './request-settings';
import DeserializeOptions from './deserialize-options';

function deserialize(source: JSONAPISource, document: JSONAPIDocument, options: DeserializeOptions,settings:FetchSettings): Transform[] {
  const deserialized = source.serializer.deserializeDocument(document);
  const records = toArray(deserialized.data);

  if (deserialized.included) {
    Array.prototype.push.apply(records, deserialized.included);
  }

  const operations = records.map(record => {
    return {
      op: 'replaceRecord',
      record
    };
  });

  return [buildTransform(operations)];
}

export interface PullOperator {
  (source: JSONAPISource, query: Query): any;
}

export const PullOperators: Dict<PullOperator> = {
  findRecord(source: JSONAPISource, query: Query) {
    const expression = query.expression as FindRecord;
    const { record } = expression;

    const requestOptions = customRequestOptions(source, query);
    const deserializeOptions = customDeserializeOptions(source,query);
    const settings = buildFetchSettings(requestOptions);

    return source.fetch(source.resourceURL(record.type, record.id), settings)
      .then(data => deserialize(source, data,deserializeOptions,settings));
  },

  findRecords(source: JSONAPISource, query: Query) {
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
      requestOptions.page = expression.page;
    }

    const deserializeOptions = customDeserializeOptions(source,query);

    requestOptions = merge(
      requestOptions,
      customRequestOptions(source, query));

    const settings = buildFetchSettings(requestOptions);

    return source.fetch(source.resourceURL(type), settings)
      .then(data => deserialize(source, data,deserializeOptions,settings));
  },

  findRelatedRecord(source: JSONAPISource, query: Query) {
    const expression = query.expression as FindRelatedRecord;
    const { record, relationship } = expression;

    const requestOptions = customRequestOptions(source, query);
    const deserializeOptions = customDeserializeOptions(source,query);
    const settings = buildFetchSettings(requestOptions);

    return source.fetch(source.relatedResourceURL(record.type, record.id, relationship), settings)
      .then(data => deserialize(source, data,deserializeOptions,settings));
  },

  findRelatedRecords(source: JSONAPISource, query: Query) {
    const expression = query.expression as FindRelatedRecords;
    const { record, relationship } = expression;

    let requestOptions = customRequestOptions(source, query);

    const deserializeOptions = customDeserializeOptions(source,query);
    const settings = buildFetchSettings(requestOptions);

    return source.fetch(source.relatedResourceURL(record.type, record.id, relationship), settings)
      .then(data => deserialize(source, data,deserializeOptions,settings));
  }
};

function customRequestOptions(source: JSONAPISource, query: Query): RequestOptions {
  const requestOptions: RequestOptions = {};

  const queryOptions = deepGet(query, ['options', 'sources', source.name]) || {};

  if (queryOptions.include) {
    requestOptions.include = queryOptions.include.join(',');
  }

  if (queryOptions.timeout) {
    requestOptions.timeout = queryOptions.timeout;
  }

  return requestOptions;
}

function customDeserializeOptions(source: JSONAPISource, query: Query): DeserializeOptions {
  const deserializeOptions: DeserializeOptions = {};

  const queryOptions = deepGet(query, ['options', 'sources', source.name]) || {};


  return deserializeOptions;
}

function buildFilterParam(source: JSONAPISource, filterSpecifiers: FilterSpecifier[]) {
  const filters = {};

  filterSpecifiers.forEach(filterSpecifier => {
    if (filterSpecifier.kind === 'attribute' && filterSpecifier.op === 'equal') {
      const attributeFilter = filterSpecifier as AttributeFilterSpecifier;

      // Note: We don't know the `type` of the attribute here, so passing `null`
      const resourceAttribute = source.serializer.resourceAttribute(null, attributeFilter.attribute);
      filters[resourceAttribute] = attributeFilter.value;
    } else {
      throw new QueryExpressionParseError('Filter operation ${specifier.op} not recognized for JSONAPISource.', filterSpecifier);
    }
  });

  return filters;
}

function buildSortParam(source: JSONAPISource, sortSpecifiers: SortSpecifier[]) {
  return sortSpecifiers.map(sortSpecifier => {
    if (sortSpecifier.kind === 'attribute') {
      const attributeSort = sortSpecifier as AttributeSortSpecifier;

      // Note: We don't know the `type` of the attribute here, so passing `null`
      const resourceAttribute = source.serializer.resourceAttribute(null, attributeSort.attribute);
      return (sortSpecifier.order === 'descending' ? '-' : '') + resourceAttribute;
    }
    throw new QueryExpressionParseError('Sort specifier ${sortSpecifier.kind} not recognized for JSONAPISource.', sortSpecifier);
  }).join(',');
}
