import { isObject } from '../lib/objects';
import { queryExpression as oqe } from '../query-expression';

export class TermBase {
  constructor(expression) {
    this.expression = expression;
  }

  toQueryExpression() {
    return this.expression;
  }
}

export class Cursor extends TermBase {
  get(path) {
    return new Value(oqe('get', path));
  }
}

export class Value extends TermBase {
  equal(value) {
    return oqe('equal', this.expression, value);
  }
}

export class RecordCursor extends Cursor {
  attribute(name) {
    return new Value(oqe('attribute', name));
  }
}

export class Record extends TermBase {
  constructor(record) {
    super(oqe('record', record));
  }
}

export class Records extends TermBase {
  filter(predicateExpression) {
    const filterBuilder = new RecordCursor();
    return new this.constructor(oqe('filter', this.expression, predicateExpression(filterBuilder)));
  }

  filterAttributes(attributeValues) {
    const attributeExpressions = Object.keys(attributeValues).map(attribute => {
      return oqe('equal',
               oqe('attribute', attribute),
               attributeValues[attribute]);
    });

    const andExpression = attributeExpressions.length === 1 ? attributeExpressions[0]
                                                            : oqe('and', ...attributeExpressions);

    return new this.constructor(oqe('filter', this.expression, andExpression));
  }

  sort(...sortExpressions) {
    return new this.constructor(oqe('sort', this.expression, sortExpressions.map(parseSortExpression)));
  }

  page(options) {
    return new this.constructor(oqe('page', this.expression, options));
  }

  static withScopes(scopes) {
    const typeTerm = function(oqe) {
      Records.call(this, oqe);
    };

    typeTerm.prototype = Object.create(Records.prototype);
    Object.assign(typeTerm.prototype, scopes);

    return typeTerm;
  }
}

export class RelatedRecord extends TermBase {
  constructor(record, relationship) {
    super(oqe('relatedRecord', record, relationship));
  }
}

export class RelatedRecords extends TermBase {
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
