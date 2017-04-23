import { toArray } from '@orbit/utils';
import {
  Query,
  QueryExpressionParseError,
  Transform
} from '@orbit/data';
import JSONAPISource from '../jsonapi-source';
import { DeserializedDocument } from '../jsonapi-serializer';
import { JSONAPIDocument } from '../jsonapi-document';
import { buildRequestSettings } from './request-settings';

function deserialize(source: JSONAPISource, document: JSONAPIDocument): Transform[] {
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

  return [Transform.from(operations)];
}

export const QueryRequestProcessors = {
  records(source: JSONAPISource, request) {
    const { type } = request;
    const settings = buildRequestSettings(request);

    return source.fetch(source.resourceURL(type), settings)
      .then(data => deserialize(source, data));
  },

  record(source: JSONAPISource, request) {
    const { record } = request;
    const settings = buildRequestSettings(request);

    return source.fetch(source.resourceURL(record.type, record.id), settings)
      .then(data => deserialize(source, data));
  },

  relationship(source: JSONAPISource, request) {
    const { record, relationship } = request;
    const settings = buildRequestSettings(request);

    return source.fetch(source.resourceRelationshipURL(record.type, record.id, relationship), settings)
      .then(data => deserialize(source, data));

      // TODO
      // .then(raw => {
      //   let relId = source.serializer.deserializeRelationship(raw.data);
      //   return relId;
      // });
  },

  relatedRecords(source: JSONAPISource, request) {
    const { record, relationship } = request;
    const settings = buildRequestSettings(request);

    return source.fetch(source.relatedResourceURL(record.type, record.id, relationship), settings)
      .then(data => deserialize(source, data));
  }
};

export function getQueryRequests(source: JSONAPISource, query) {
  // For now, assume a 1:1 mapping between queries and requests
  return [buildRequestFromQuery(source, query)];
}

function buildRequestFromQuery(source: JSONAPISource, query: Query) {
  const request = buildRequestFromExpression(source, query.expression);

  const options = (query.options && query.options.sources && query.options.sources[source.name]) || {};

  if (options.include) {
    request.include = options.include.join(',');
  }

  if (options.timeout) {
    request.timeout = options.timeout;
  }

  return request;
}

function buildRequestFromExpression(source: JSONAPISource, expression, request = {}): any {
  if (ExpressionToRequestMap[expression.op]) {
    ExpressionToRequestMap[expression.op](source, expression, request);
  } else {
    throw new QueryExpressionParseError('Query expression could not be parsed.', expression);
  }

  return request;
}

const ExpressionToRequestMap = {
  records(source: JSONAPISource, expression, request) {
    if (request.op) {
      throw new QueryExpressionParseError('Query request `op` can not be redefined.', expression);
    }

    request.op = 'records';
    request.type = expression.args[0];
  },

  record(source: JSONAPISource, expression, request) {
    if (request.op) {
      throw new QueryExpressionParseError('Query request `op` can not be redefined.', expression);
    }

    request.op = 'record';
    request.record = expression.args[0];
  },

  filter(source: JSONAPISource, expression, request) {
    const [select, filters] = expression.args;
    request.filter = buildFilters(source, filters);

    buildRequestFromExpression(source, select, request);
  },

  sort(source: JSONAPISource, expression, request) {
    const [select, sortExpressions] = expression.args;
    request.sort = buildSort(source, sortExpressions);

    buildRequestFromExpression(source, select, request);
  },

  page(source: JSONAPISource, expression, request) {
    const [select, page] = expression.args;
    request.page = page;

    buildRequestFromExpression(source, select, request);
  },

  relatedRecords(source: JSONAPISource, expression, request) {
    request.op = 'relatedRecords';
    request.record = expression.args[0];
    request.relationship = expression.args[1];
  }
};

function buildFilters(source: JSONAPISource, expression) {
  const filters = {};

  if (expression.op === 'and') {
    expression.args.forEach(arg => parseFilter(source, arg, filters));
  } else {
    parseFilter(source, expression, filters);
  }

  return filters;
}

function parseFilter(source: JSONAPISource, expression, filters) {
  if (expression.op === 'equal') {
    const [filterExp, filterValue] = expression.args;
    if (filterExp.op === 'attribute') {
      const [attribute] = filterExp.args;
      // Note: We don't know the `type` of the attribute here, so passing `null`
      const resourceAttribute = source.serializer.resourceAttribute(null, attribute);
      filters[resourceAttribute] = filterValue;
    }
  }
}

function buildSort(source: JSONAPISource, sortExpressions) {
  return sortExpressions.map(exp => {
    return parseSortExpression(source, exp);
  }).join(',');
}

function parseSortExpression(source: JSONAPISource, sortExpression) {
  if (sortExpression.field.op === 'attribute') {
    const [attribute] = sortExpression.field.args;
    // Note: We don't know the `type` of the attribute here, so passing `null`
    const resourceAttribute = source.serializer.resourceAttribute(null, attribute);
    return (sortExpression.order === 'descending' ? '-' : '') + resourceAttribute;
  }
  throw new QueryExpressionParseError('Query expression could not be parsed.', sortExpression.field);
}
