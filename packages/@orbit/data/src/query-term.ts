import { isObject } from '@orbit/utils';
import { QueryExpression, FindRecord, FindRelatedRecord, FindRelatedRecords, FindRecords, SortSpecifier, AttributeSortSpecifier, PageSpecifier, FilterSpecifier, SortOrder } from './query-expression';
import { RecordIdentity } from './record';

/**
 * Query terms are used by query builders to allow for the construction of
 * query expressions in composable patterns.
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
 * A query term representing a single record.
 */
export class FindRecordTerm extends QueryTerm {
  expression: FindRecord;

  constructor(record: RecordIdentity) {
    let expression: FindRecord = {
      op: 'findRecord',
      record
    };

    super(expression);
  }
}

export class FindRelatedRecordTerm extends QueryTerm {
  expression: FindRelatedRecord;

  constructor(record: RecordIdentity, relationship: string) {
    let expression: FindRelatedRecord = {
      op: 'findRelatedRecord',
      record,
      relationship
    };

    super(expression);
  }
}

export class FindRelatedRecordsTerm extends QueryTerm {
  expression: FindRelatedRecords;

  constructor(record: RecordIdentity, relationship: string) {
    let expression: FindRelatedRecords = {
      op: 'findRelatedRecords',
      record,
      relationship
    };

    super(expression);
  }
}

export class FindRecordsTerm extends QueryTerm {
  expression: FindRecords;

  constructor(type?: string) {
    let expression: FindRecords = {
      op: 'findRecords',
      type
    };

    super(expression);
  }

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
   */
  sort(...sortSpecifiers: SortSpecifier[]): FindRecordsTerm {
    const specifiers = sortSpecifiers.map(parseSortSpecifier);
    this.expression.sort = (this.expression.sort || []).concat(specifiers);
    return this;
  }

  /**
   * Applies pagination to a collection query.
   *
   * Note: Options are currently an opaque pass-through to remote sources.
   */
  page(options: PageSpecifier): FindRecordsTerm {
    this.expression.page = options;
    return this;
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
  filter(...filterSpecifiers: any[]): FindRecordsTerm {
    filterSpecifiers.forEach(normalizeFilterSpecifier);
    this.expression.filter = (this.expression.filter || []).concat(filterSpecifiers);
    return this;
  }
}

function normalizeFilterSpecifier(specifier: FilterSpecifier): void {
  if (!specifier.kind) {
    if (specifier.hasOwnProperty('relation')) {
      if (specifier.hasOwnProperty('record')) {
        specifier.kind = 'relatedRecord';
      } else if (specifier.hasOwnProperty('records')) {
        specifier.kind = 'relatedRecords';
      }
    } else {
      specifier.kind = 'attribute';
    }
  }
  specifier.op = specifier.op || 'equal';
}

function parseSortSpecifier(sortSpecifier: SortSpecifier | string): SortSpecifier {
  if (isObject(sortSpecifier)) {
    let s = sortSpecifier as SortSpecifier;
    s.kind = s.kind || 'attribute';
    s.order = s.order || 'ascending';
    return s;
  } else if (typeof sortSpecifier === 'string') {
    return parseSortSpecifierString(sortSpecifier);
  }
  throw new Error('Sort expression must be either an object or a string.');
}

function parseSortSpecifierString(sortSpecifier: string): AttributeSortSpecifier  {
  let attribute: string;
  let order: SortOrder;

  if (sortSpecifier[0] === '-') {
    attribute = sortSpecifier.slice(1);
    order = 'descending';
  } else {
    attribute = sortSpecifier;
    order = 'ascending';
  }

  return {
    kind: 'attribute',
    attribute,
    order
  };
}
