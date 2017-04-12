import { isObject } from '@orbit/utils';
import { oqe, QueryExpression } from './query-expression';

/**
 * Query terms are used by query builders to allow for the construction of
 * query expressions in composable patterns. 
 * 
 * @export
 * @class QueryTerm
 */
export class QueryTerm {
  expression: QueryExpression;

  constructor(expression?: QueryExpression) {
    this.expression = expression;
  }

  toQueryExpression(): QueryExpression {
    return this.expression;
  }
}

/**
 * A query term that represents a value.
 * 
 * Supports equality checks for now. Could be expanded to handle any number of
 * comparisons.
 * 
 * @export
 * @class ValueTerm
 * @extends {QueryTerm}
 */
export class ValueTerm extends QueryTerm {
  equal(value) {
    return oqe('equal', this.expression, value);
  }
}

/**
 * A query term that allows for iterating over records.
 * 
 * @export
 * @class RecordCursor
 * @extends {QueryTerm}
 */
export class RecordCursor extends QueryTerm {
  attribute(name): ValueTerm {
    return new ValueTerm(oqe('attribute', name));
  }
}

/**
 * A query term representing a single record.
 * 
 * @export
 * @class RecordTerm
 * @extends {QueryTerm}
 */
export class RecordTerm extends QueryTerm {
  constructor(record) {
    super(oqe('record', record));
  }
}

export class RecordsTerm extends QueryTerm {
  sort(...sortExpressions): RecordsTerm {
    return new RecordsTerm(oqe('sort', this.expression, sortExpressions.map(parseSortExpression)));
  }

  page(options): RecordsTerm {
    return new RecordsTerm(oqe('page', this.expression, options));
  }

  filter(predicateExpression): RecordsTerm {
    const filterBuilder = new RecordCursor();
    return new RecordsTerm(oqe('filter', this.expression, predicateExpression(filterBuilder)));
  }

  filterAttributes(attributeValues): RecordsTerm {
    const attributeExpressions = Object.keys(attributeValues).map(attribute => {
      return oqe('equal',
               oqe('attribute', attribute),
               attributeValues[attribute]);
    });

    const andExpression = attributeExpressions.length === 1 ? attributeExpressions[0]
                                                            : oqe('and', ...attributeExpressions);

    return new RecordsTerm(oqe('filter', this.expression, andExpression));
  }
}

export class RelatedRecordTerm extends QueryTerm {
  constructor(record, relationship) {
    super(oqe('relatedRecord', record, relationship));
  }
}

export class RelatedRecordsTerm extends RecordsTerm {
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
