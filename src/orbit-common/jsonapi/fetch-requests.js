import { toArray } from 'orbit/lib/objects';
import Transform from 'orbit/transform';
import { QueryExpressionParseError } from '../lib/exceptions';

function deserialize(source, data) {
  const deserialized = source.serializer.deserialize(data);
  const records = toArray(deserialized.primary);

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

export const FetchRequestProcessors = {
  recordsOfType(source, request) {
    const { type } = request;
    const hash = {};

    if (request.filter) {
      hash.data = hash.data || {};
      hash.data.filter = request.filter;
    }

    return source.ajax(source.resourceURL(type), 'GET', hash)
      .then(data => deserialize(source, data));
  },

  record(source, request) {
    const { record } = request;

    return source.ajax(source.resourceURL(record.type, record.id), 'GET')
      .then(data => deserialize(source, data));
  },

  relationship(source, request) {
    const { record, relationship } = request;

    return source.ajax(source.resourceRelationshipURL(record.type, record.id, relationship), 'GET')
      .then(raw => {
        let relId = source.serializer.deserializeRelationship(raw.data);
        return relId;
      });
  },

  relatedRecords(source, request) {
    const { record, relationship } = request;

    return source.ajax(source.relatedResourceURL(record.type, record.id, relationship), 'GET')
      .then(data => deserialize(source, data));
  }
};

export function getFetchRequests(query) {
  // For now, assume a 1:1 mapping between queries and fetch requests
  return [buildFetchRequest(query.expression)];
}

function buildFetchRequest(expression, request = {}) {
  if (ExpressionToRequestMap[expression.op]) {
    ExpressionToRequestMap[expression.op](expression, request);
  } else {
    throw new QueryExpressionParseError('Query expression could not be parsed.', expression);
  }

  return request;
}

const ExpressionToRequestMap = {
  recordsOfType(expression, request) {
    if (request.op) {
      throw new QueryExpressionParseError('Query request `op` can not be redefined.', expression);
    }

    request.op = 'recordsOfType';
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

    buildFetchRequest(select, request);
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
    const [ filterExp, filterValue ] = expression.args;
    if (filterExp.op === 'attribute') {
      const [ attribute ] = filterExp.args;
      filters[attribute] = filterValue;
    }
  }
}
