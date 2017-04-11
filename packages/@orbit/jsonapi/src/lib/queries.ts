import { toArray, deepSet } from '@orbit/utils';
import {
  Query,
  QueryExpressionParseError,
  Transform
} from '@orbit/data';
import Source from '../jsonapi-source';
import { DeserializedDocument } from '../jsonapi-serializer';
import { JSONAPIDocument } from '../jsonapi-document';

function deserialize(source: Source, document: JSONAPIDocument): Transform[] {
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
  records(source: Source, request) {
    const { type } = request;
    const settings = buildRequestSettings(request);

    return source.fetch(source.resourceURL(type), settings)
      .then(data => deserialize(source, data));
  },

  record(source: Source, request) {
    const { record } = request;
    const settings = buildRequestSettings(request);

    return source.fetch(source.resourceURL(record.type, record.id), settings)
      .then(data => deserialize(source, data));
  },

  relationship(source: Source, request) {
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

  relatedRecords(source: Source, request) {
    const { record, relationship } = request;
    const settings = buildRequestSettings(request);

    return source.fetch(source.relatedResourceURL(record.type, record.id, relationship), settings)
      .then(data => deserialize(source, data));
  }
};

function buildRequestSettings(request) {
  const settings = {};

  for (const param of ['filter', 'include', 'page', 'sort']) {
    if (request[param]) {
      deepSet(settings, ['params', param], request[param]);
    }
  }

  return settings;
}

export function getQueryRequests(source: Source, query) {
  // For now, assume a 1:1 mapping between queries and requests
  return [buildRequestFromQuery(source, query)];
}

function buildRequestFromQuery(source: Source, query: Query) {
  const request = buildRequestFromExpression(query.expression);

  const options = (query.options && query.options.sources && query.options.sources[source.name]) || {};

  if (options.include) {
    request.include = options.include.join(',');
  }

  return request;
}

function buildRequestFromExpression(expression, request = {}): any {
  if (ExpressionToRequestMap[expression.op]) {
    ExpressionToRequestMap[expression.op](expression, request);
  } else {
    throw new QueryExpressionParseError('Query expression could not be parsed.', expression);
  }

  return request;
}

const ExpressionToRequestMap = {
  records(expression, request) {
    if (request.op) {
      throw new QueryExpressionParseError('Query request `op` can not be redefined.', expression);
    }

    request.op = 'records';
    request.type = expression.args[0];
  },

  record(expression, request) {
    if (request.op) {
      throw new QueryExpressionParseError('Query request `op` can not be redefined.', expression);
    }

    request.op = 'record';
    request.record = expression.args[0];
  },

  filter(expression, request) {
    const [select, filters] = expression.args;
    request.filter = buildFilters(filters);

    buildRequestFromExpression(select, request);
  },

  sort(expression, request) {
    const [select, sortExpressions] = expression.args;
    request.sort = buildSort(sortExpressions);

    buildRequestFromExpression(select, request);
  },

  page(expression, request) {
    const [select, page] = expression.args;
    request.page = page;

    buildRequestFromExpression(select, request);
  },

  relatedRecords(expression, request) {
    request.op = 'relatedRecords';
    request.record = expression.args[0];
    request.relationship = expression.args[1];
  }
};

function buildFilters(expression) {
  const filters = {};

  if (expression.op === 'and') {
    expression.args.forEach(arg => parseFilter(arg, filters));
  } else {
    parseFilter(expression, filters);
  }

  return filters;
}

function parseFilter(expression, filters) {
  if (expression.op === 'equal') {
    const [filterExp, filterValue] = expression.args;
    if (filterExp.op === 'attribute') {
      const [attribute] = filterExp.args;
      filters[attribute] = filterValue;
    }
  }
}

function buildSort(sortExpressions) {
  return sortExpressions.map(parseSortExpression).join(',');
}

function parseSortExpression(sortExpression) {
  if (sortExpression.field.op === 'attribute') {
    const [attribute] = sortExpression.field.args;
    return (sortExpression.order === 'descending' ? '-' : '') + attribute;
  }
  throw new QueryExpressionParseError('Query expression could not be parsed.', sortExpression.field);
}
