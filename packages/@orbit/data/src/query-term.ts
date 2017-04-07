import { isObject } from '@orbit/utils';
import { oqe, QueryExpression } from './query-expression';

export class QueryTerm {
  expression: QueryExpression;

  constructor(expression?: QueryExpression) {
    this.expression = expression;
  }

  toQueryExpression(): QueryExpression {
    return this.expression;
  }
}

export class Cursor extends QueryTerm {
  get(path) {
    return new Value(oqe('get', path));
  }
}

export class Value extends QueryTerm {
  equal(value) {
    return oqe('equal', this.expression, value);
  }
}

export class RecordCursor extends Cursor {
  attribute(name) {
    return new Value(oqe('attribute', name));
  }
}

export class Record extends QueryTerm {
  constructor(record) {
    super(oqe('record', record));
  }
}

export class Records extends QueryTerm {
  sort(...sortExpressions) {
    return new Records(oqe('sort', this.expression, sortExpressions.map(parseSortExpression)));
  }

  page(options) {
    return new Records(oqe('page', this.expression, options));
  }

  filter(predicateExpression) {
    const filterBuilder = new RecordCursor();
    return new Records(oqe('filter', this.expression, predicateExpression(filterBuilder)));
  }

  filterAttributes(attributeValues) {
    const attributeExpressions = Object.keys(attributeValues).map(attribute => {
      return oqe('equal',
               oqe('attribute', attribute),
               attributeValues[attribute]);
    });

    const andExpression = attributeExpressions.length === 1 ? attributeExpressions[0]
                                                            : oqe('and', ...attributeExpressions);

    return new Records(oqe('filter', this.expression, andExpression));
  }
}

export class RelatedRecord extends QueryTerm {
  constructor(record, relationship) {
    super(oqe('relatedRecord', record, relationship));
  }
}

export class RelatedRecords extends Records {
  constructor(record, relationship) {
    super(oqe('relatedRecords', record, relationship));
  }
}

function parseSortExpression(sortExpression) {
  if (isObject(sortExpression)) {
    return parseSortExpressionObject(sortExpression);
  } else if (typeof sortExpression === 'string') {
    return parseCompactSortExpression(sortExpression);
  }
  throw new Error('Sort expression must be either an object or a string.');
}

function parseSortExpressionObject(sortExpression) {
  if (sortExpression.attribute === undefined) {
    throw new Error('Unsupported sort field type.');
  }

  const order = sortExpression.order || 'ascending';
  if (order !== 'ascending' && order !== 'descending') {
    throw new Error('Invalid sort order.');
  }

  return {
    field: oqe('attribute', sortExpression.attribute),
    order
  };
}

function parseCompactSortExpression(sortExpression) {
  let attribute;
  let order;

  if (sortExpression[0] === '-') {
    attribute = sortExpression.slice(1);
    order = 'descending';
  } else {
    attribute = sortExpression;
    order = 'ascending';
  }

  return {
    field: oqe('attribute', attribute),
    order
  };
}
