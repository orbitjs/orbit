import { isObject } from '@orbit/utils';
import { QueryTerm } from '@orbit/data';
import {
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
} from './record-query-expression';
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
 * A query term representing a single record.
 */
export class FindRecordTerm extends QueryTerm<FindRecord> {
  constructor(record: RecordIdentity) {
    let expression: FindRecord = {
      op: 'findRecord',
      record
    };

    super(expression);
  }
}

export class FindRelatedRecordTerm extends QueryTerm<FindRelatedRecord> {
  constructor(record: RecordIdentity, relationship: string) {
    let expression: FindRelatedRecord = {
      op: 'findRelatedRecord',
      record,
      relationship
    };

    super(expression);
  }
}

export class FindRelatedRecordsTerm extends QueryTerm<FindRelatedRecords> {
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
  sort(...params: SortQBParam[]): this {
    const specifiers = params.map(sortParamToSpecifier);
    this.expression.sort = (this.expression.sort || []).concat(specifiers);
    return this;
  }

  /**
   * Applies pagination to a collection query.
   */
  page(param: PageQBParam): this {
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
  filter(...params: FilterQBParam[]): this {
    const specifiers = params.map(filterParamToSpecifier);
    this.expression.filter = (this.expression.filter || []).concat(specifiers);
    return this;
  }
}

export class FindRecordsTerm extends QueryTerm<FindRecords> {
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
  sort(...params: SortQBParam[]): this {
    const specifiers = params.map(sortParamToSpecifier);
    this.expression.sort = (this.expression.sort || []).concat(specifiers);
    return this;
  }

  /**
   * Applies pagination to a collection query.
   */
  page(param: PageQBParam): this {
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
  filter(...params: FilterQBParam[]): this {
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

export type RecordQueryTerm =
  | FindRecordTerm
  | FindRelatedRecordTerm
  | FindRelatedRecordsTerm
  | FindRecordsTerm;
