import { isObject } from '@orbit/utils';
import { oqe, QueryExpression } from './query-expression';

/**
 * An interface for specifying record sorting.
 * 
 * @export
 * @interface SortSpecifier
 */
export interface SortSpecifier {
  attribute: string,
  order: 'ascending' | 'descending'
}

/**
 * An expression form of a `SortSpecifier`.
 * 
 * @export
 * @interface SortExpression
 */
export interface SortExpression {
  field: QueryExpression,
  order: 'ascending' | 'descending'
}

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
 * @export
 * @class ValueTerm
 * @extends {QueryTerm}
 */
export class ValueTerm extends QueryTerm {
  /**
   * Returns an expression that will check whether the context's value is equal 
   * to a specified value.
   * 
   * @param {any} value 
   * @returns {QueryExpression} 
   * 
   * @memberOf ValueTerm
   */
  equal(value): QueryExpression {
    return oqe('equal', this.expression, value);
  }
}

/**
 * A query term that allows for iterating over records and evaluating each one.
 * 
 * @export
 * @class RecordCursor
 * @extends {QueryTerm}
 */
export class RecordCursor extends QueryTerm {
  /**
   * Retrieve the value of an attribute.
   * 
   * @param {string} name 
   * @returns {ValueTerm} 
   * 
   * @memberOf RecordCursor
   */
  attribute(name: string): ValueTerm {
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

/**
 * A query term representing a collection of records.
 * 
 * @export
 * @class RecordsTerm
 * @extends {QueryTerm}
 */
export class RecordsTerm extends QueryTerm {
  /**
   * Applies sorting to a collection query.
   * 
   * Sort specifiers can be expressed in object form, like:
   * 
   * ```ts
   * { attribute: 'name', order: 'descending' }
   * { attribute: 'name', order: 'ascending' }
   * ```
   * 
   * Or in string form, like:
   * 
   * ```ts
   * '-name' // descending order
   * 'name'  // ascending order
   * ```
   * 
   * @param {SortSpecifier[] | string[]} sortSpecifiers 
   * @returns {RecordsTerm} 
   * 
   * @memberOf RecordsTerm
   */
  sort(...sortSpecifiers): RecordsTerm {
    return new RecordsTerm(oqe('sort', this.expression, sortSpecifiers.map(parseSortSpecifier)));
  }

  /**
   * Applies pagination to a collection query.
   * 
   * Note: Options are currently an opaque pass-through to remote sources.
   * 
   * @param {object} options
   * @returns {RecordsTerm} 
   * 
   * @memberOf RecordsTerm
   */
  page(options: object): RecordsTerm {
    return new RecordsTerm(oqe('page', this.expression, options));
  }

  /**
   * Apply an advanced filter expression based on a `RecordCursor`.
   *
   * For example:
   * 
   * ```ts
   * oqb
   *   .records('planet')
   *   .filter(record =>
   *     oqb.or(
   *       record.attribute('name').equal('Jupiter'),
   *       record.attribute('name').equal('Pluto')
   *     )
   *   )
   * ```
   * 
   * @param {(RecordCursor) => void} predicateExpression 
   * @returns {RecordsTerm} 
   * 
   * @memberOf RecordsTerm
   */
  filter(predicateExpression: (RecordCursor) => void): RecordsTerm {
    const filterBuilder = new RecordCursor();
    return new RecordsTerm(oqe('filter', this.expression, predicateExpression(filterBuilder)));
  }

  /**
   * Apply a group of equality filters based on record attributes.
   * 
   * For example:
   * 
   * ```ts
   * oqb
   *   .records('planet')
   *   .filterAttributes({
   *     name: 'Jupiter',
   *     age: 23000000
   *   })
   * ```
   * 
   * @param {any} attributeValues 
   * @returns {RecordsTerm} 
   * 
   * @memberOf RecordsTerm
   */
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

/**
 * A query term representing a related record.
 * 
 * @export
 * @class RelatedRecordTerm
 * @extends {QueryTerm}
 */
export class RelatedRecordTerm extends QueryTerm {
  constructor(record, relationship) {
    super(oqe('relatedRecord', record, relationship));
  }
}

/**
 * A query term representing a collection of records in a to-many relationship.
 * 
 * @export
 * @class RelatedRecordsTerm
 * @extends {RecordsTerm}
 */
export class RelatedRecordsTerm extends RecordsTerm {
  constructor(record, relationship) {
    super(oqe('relatedRecords', record, relationship));
  }
}

function parseSortSpecifier(sortSpecifier: SortSpecifier | string) {
  if (isObject(sortSpecifier)) {
    return parseSortSpecifierObject(<SortSpecifier>sortSpecifier);
  } else if (typeof sortSpecifier === 'string') {
    return parseSortSpecifierString(sortSpecifier);
  }
  throw new Error('Sort expression must be either an object or a string.');
}

function parseSortSpecifierObject(sortSpecifier: SortSpecifier): SortExpression {
  if (sortSpecifier.attribute === undefined) {
    throw new Error('Unsupported sort field type.');
  }

  const order = sortSpecifier.order || 'ascending';
  if (order !== 'ascending' && order !== 'descending') {
    throw new Error('Invalid sort order.');
  }

  return {
    field: oqe('attribute', sortSpecifier.attribute),
    order
  };
}

function parseSortSpecifierString(sortSpecifier: string): SortExpression {
  let attribute;
  let order;

  if (sortSpecifier[0] === '-') {
    attribute = sortSpecifier.slice(1);
    order = 'descending';
  } else {
    attribute = sortSpecifier;
    order = 'ascending';
  }

  return {
    field: oqe('attribute', attribute),
    order
  };
}
