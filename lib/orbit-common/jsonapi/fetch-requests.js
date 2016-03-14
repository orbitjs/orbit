import { toArray } from 'orbit/lib/objects';
import Transform from 'orbit/transform';

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
    const { type, id } = request;

    return source.ajax(source.resourceURL(type, id), 'GET')
      .then(data => deserialize(source, data));
  },

  relationship(source, request) {
    const { type, id, relationship } = request;

    return source.ajax(source.resourceRelationshipURL(type, id, relationship), 'GET')
      .then(raw => {
        let relId = source.serializer.deserializeRelationship(raw.data);
        return relId;
      });
  },

  relatedRecords(source, request) {
    const { type, id, relationship } = request;

    return source.ajax(source.relatedResourceURL(type, id, relationship), 'GET')
      .then(data => deserialize(source, data));
  }
};

export function getFetchRequests(query) {
  // For now, assume a 1:1 mapping between queries and fetch requests
  return [getFetchRequest(query.expression)];
}

function getFetchRequest(expression) {
  let request;

  console.log('expression', expression);

  if (ExpressionToRequestMap[expression.op]) {
    request = ExpressionToRequestMap[expression.op](expression);
  } else if (RequestModifierMap[expression.op]) {
    const select = expression.args[0];
    request = getFetchRequest(select);
    RequestModifierMap[expression.op](request, expression);
  } else {
    throw new Error('TODO');
  }

  console.log('request', request);

  return request;
}

const ExpressionToRequestMap = {
  recordsOfType(expression) {
    return {
      op: 'recordsOfType',
      type: expression.args[0]
    };
  },

  record(expression) {
    return {
      op: 'recordsOfType',
      type: expression.args[0],
      id: expression.args[1]
    };
  }
};

const RequestModifierMap = {
  filter(request, expression) {
    const filters = expression.args[1];
    request.filter = buildFilters(filters);
  }
};

function buildFilters(expression) {
  const filters = {};

  if (expression.op === 'and') {
    expression.args.forEach(arg => {
      parseFilter(filters, arg);
    });
  } else {
    parseFilter(filters, expression);
  }

  return filters;
}

function parseFilter(filters, expression) {
  if (expression.op === 'equal') {
    const [ filterExp, filterValue ] = expression.args;
    if (filterExp.op === 'attribute') {
      const [ attribute ] = filterExp.args;
      filters[attribute] = filterValue;
    }
  }
}
