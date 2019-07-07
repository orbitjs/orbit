import { isObject } from '@orbit/utils';
import {
  QueryExpression,
  FindRecord,
  FindRelatedRecord,
  FindRelatedRecords,
  FindRecords,
  SortOrder,
  SortSpecifier,
  AttributeSortSpecifier,
  PageSpecifier,
  SetComparisonOperator,
  ValueComparisonOperator,
  FilterSpecifier,
  AttributeFilterSpecifier,
  RelatedRecordFilterSpecifier,
  RelatedRecordsFilterSpecifier
} from './query-expression';
import { RecordIdentity } from './record';

export interface AttributeSortQBParam {
  attribute: string;
  order?: SortOrder;
}

export type SortQBParam = SortSpecifier | AttributeSortQBParam | string;

export interface PageQBParam {
  offset?: number;
  limit?: number;
}

export interface AttributeFilterQBParam {
  op?: ValueComparisonOperator;
  attribute: string;
  value: any;
}

export interface RelatedRecordFilterQBParam {
  op?: SetComparisonOperator;
  relation: string;
  record: RecordIdentity | RecordIdentity[] | null;
}

export interface RelatedRecordsFilterQBParam {
  op?: SetComparisonOperator;
  relation: string;
  records: RecordIdentity[];
}

export type FilterQBParam =
  | FilterSpecifier
  | AttributeFilterQBParam
  | RelatedRecordFilterQBParam
  | RelatedRecordsFilterQBParam;

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
  sort(...params: SortQBParam[]): FindRelatedRecordsTerm {
    const specifiers = params.map(sortParamToSpecifier);
    this.expression.sort = (this.expression.sort || []).concat(specifiers);
    return this;
  }

  /**
   * Applies pagination to a collection query.
   */
  page(param: PageQBParam): FindRelatedRecordsTerm {
    this.expression.page = pageParamToSpecifier(param);
    return this;
  }

  /**
   * Apply a filter expression.
   *
   * For example:
   *
   * ```ts
   * oqb
   *   .records('planet')
   *   .filter({ attribute: 'atmosphere', value: true },
   *           { attribute: 'classification', value: 'terrestrial' });
   * ```
   */
  filter(...params: FilterQBParam[]): FindRelatedRecordsTerm {
    const specifiers = params.map(filterParamToSpecifier);
    this.expression.filter = (this.expression.filter || []).concat(specifiers);
    return this;
  }
}

export class FindRecordsTerm extends QueryTerm {
  expression: FindRecords;

  constructor(typeOrIdentities?: string | RecordIdentity[]) {
    let expression: FindRecords = {
      op: 'findRecords'
    };

    if (typeof typeOrIdentities === 'string') {
      expression.type = typeOrIdentities;
    } else if (Array.isArray(typeOrIdentities)) {
      expression.records = typeOrIdentities;
    }

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
  sort(...params: SortQBParam[]): FindRecordsTerm {
    const specifiers = params.map(sortParamToSpecifier);
    this.expression.sort = (this.expression.sort || []).concat(specifiers);
    return this;
  }

  /**
   * Applies pagination to a collection query.
   */
  page(param: PageQBParam): FindRecordsTerm {
    this.expression.page = pageParamToSpecifier(param);
    return this;
  }

  /**
   * Apply a filter expression.
   *
   * For example:
   *
   * ```ts
   * oqb
   *   .records('planet')
   *   .filter({ attribute: 'atmosphere', value: true },
   *           { attribute: 'classification', value: 'terrestrial' });
   * ```
   */
  filter(...params: FilterQBParam[]): FindRecordsTerm {
    const specifiers = params.map(filterParamToSpecifier);
    this.expression.filter = (this.expression.filter || []).concat(specifiers);
    return this;
  }
}

function filterParamToSpecifier(param: FilterQBParam): FilterSpecifier {
  if (param.hasOwnProperty('kind')) {
    return param as FilterSpecifier;
  }
  const op = param.op || 'equal';
  if (param.hasOwnProperty('relation')) {
    if (param.hasOwnProperty('record')) {
      return {
        kind: 'relatedRecord',
        op,
        relation: (param as RelatedRecordFilterQBParam).relation,
        record: (param as RelatedRecordFilterQBParam).record
      } as RelatedRecordFilterSpecifier;
    } else if (param.hasOwnProperty('records')) {
      return {
        kind: 'relatedRecords',
        op,
        relation: (param as RelatedRecordsFilterQBParam).relation,
        records: (param as RelatedRecordsFilterQBParam).records
      } as RelatedRecordsFilterSpecifier;
    }
  } else if (param.hasOwnProperty('attribute')) {
    return {
      kind: 'attribute',
      op,
      attribute: (param as AttributeFilterQBParam).attribute,
      value: (param as AttributeFilterQBParam).value
    } as AttributeFilterSpecifier;
  }
  throw new Error('Unrecognized filter param.');
}

function pageParamToSpecifier(param: PageQBParam): PageSpecifier {
  if (param.hasOwnProperty('offset') || param.hasOwnProperty('limit')) {
    return {
      kind: 'offsetLimit',
      offset: param.offset,
      limit: param.limit
    };
  }
  throw new Error('Unrecognized page param.');
}

function sortParamToSpecifier(param: SortQBParam): SortSpecifier {
  if (isObject(param)) {
    if (param.hasOwnProperty('kind')) {
      return param as SortSpecifier;
    } else if (param.hasOwnProperty('attribute')) {
      return {
        kind: 'attribute',
        attribute: (param as AttributeSortQBParam).attribute,
        order: (param as AttributeSortQBParam).order || 'ascending'
      } as AttributeSortSpecifier;
    }
  } else if (typeof param === 'string') {
    return parseSortParamString(param);
  }
  throw new Error('Unrecognized sort param.');
}

function parseSortParamString(sortSpecifier: string): AttributeSortSpecifier {
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
