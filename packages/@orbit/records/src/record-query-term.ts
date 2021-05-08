import { QueryTerm } from '@orbit/data';
import { isObject } from '@orbit/utils';
import { RecordIdentity } from './record';
import { ValidationError } from './record-exceptions';
import { RecordQueryBuilder } from './record-query-builder';
import {
  AttributeFilterSpecifier,
  AttributeSortSpecifier,
  FilterSpecifier,
  FindRecord,
  FindRecords,
  FindRelatedRecord,
  FindRelatedRecords,
  PageSpecifier,
  RecordQueryExpression,
  RelatedRecordFilterSpecifier,
  RelatedRecordsFilterSpecifier,
  SetComparisonOperator,
  SortOrder,
  SortSpecifier,
  ValueComparisonOperator
} from './record-query-expression';
import { RecordSchema } from './record-schema';
import { RecordQueryExpressionValidator } from './record-validators/record-query-expression-validator';
import { StandardRecordValidators } from './record-validators/standard-record-validators';

export interface AttributeSortParam {
  attribute: string;
  order?: SortOrder;
}

export type SortParam = SortSpecifier | AttributeSortParam | string;

export interface PageParam {
  offset?: number;
  limit?: number;
}

export interface AttributeFilterParam {
  op?: ValueComparisonOperator;
  attribute: string;
  value: any;
}

export interface RelatedRecordFilterParam<RI = RecordIdentity> {
  op?: SetComparisonOperator;
  relation: string;
  record: RI | RI[] | null;
}

export interface RelatedRecordsFilterParam<RI = RecordIdentity> {
  op?: SetComparisonOperator;
  relation: string;
  records: RI[];
}

export type FilterParam<RI = RecordIdentity> =
  | FilterSpecifier
  | AttributeFilterParam
  | RelatedRecordFilterParam<RI>
  | RelatedRecordsFilterParam<RI>;

function isFilterSpecifier<RI = RecordIdentity>(
  param: FilterParam<RI>
): param is FilterSpecifier {
  return (param as FilterSpecifier).kind !== undefined;
}

function isAttributeFilterParam<RI = RecordIdentity>(
  param: FilterParam<RI>
): param is AttributeFilterParam {
  return (param as AttributeFilterParam).attribute !== undefined;
}

function isRelatedRecordFilterParam<RI = RecordIdentity>(
  param: FilterParam<RI>
): param is RelatedRecordFilterParam<RI> {
  return (
    (param as RelatedRecordFilterParam<RI>).relation !== undefined &&
    (param as RelatedRecordFilterParam<RI>).record !== undefined
  );
}

function isRelatedRecordsFilterParam<RI = RecordIdentity>(
  param: FilterParam<RI>
): param is RelatedRecordsFilterParam<RI> {
  return (
    (param as RelatedRecordsFilterParam<RI>).relation !== undefined &&
    (param as RelatedRecordsFilterParam<RI>).records !== undefined
  );
}

export class BaseRecordQueryTerm<
  QE extends RecordQueryExpression,
  RT = string,
  RI = RecordIdentity
> extends QueryTerm<QE> {
  $queryBuilder: RecordQueryBuilder<RT, RI>;

  constructor(queryBuilder: RecordQueryBuilder<RT, RI>, expression: QE) {
    super(expression);
    this.$queryBuilder = queryBuilder;
  }

  toQueryExpression(): QE {
    const expression = super.toQueryExpression();

    const validatorFor = this.$queryBuilder.$validatorFor;
    if (validatorFor) {
      const schema = this.$queryBuilder.$schema as RecordSchema;
      const validateRecordQueryExpression = validatorFor(
        StandardRecordValidators.RecordQueryExpression
      ) as RecordQueryExpressionValidator;

      const issues = validateRecordQueryExpression(expression, {
        validatorFor,
        schema
      });

      if (issues !== undefined) {
        throw new ValidationError(
          'Validation isssues encountered while building a query expression',
          issues
        );
      }
    }

    return expression;
  }
}

/**
 * A query term representing a single record.
 */
export class FindRecordTerm<
  RT = string,
  RI = RecordIdentity
> extends BaseRecordQueryTerm<FindRecord, RT, RI> {
  constructor(
    queryBuilder: RecordQueryBuilder<RT, RI>,
    record: RecordIdentity
  ) {
    super(queryBuilder, {
      op: 'findRecord',
      record
    });
  }
}

export class FindRelatedRecordTerm<
  RT = string,
  RI = RecordIdentity
> extends BaseRecordQueryTerm<FindRelatedRecord, RT, RI> {
  constructor(
    queryBuilder: RecordQueryBuilder<RT, RI>,
    record: RecordIdentity,
    relationship: string
  ) {
    super(queryBuilder, {
      op: 'findRelatedRecord',
      record,
      relationship
    });
  }
}

export class FindRecordsTerm<
  RT = string,
  RI = RecordIdentity
> extends BaseRecordQueryTerm<FindRecords | FindRelatedRecords, RT, RI> {
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
  sort(...params: SortParam[]): this {
    const specifiers = params.map((p) => this.$sortParamToSpecifier(p));
    this._expression.sort = (this._expression.sort ?? []).concat(specifiers);
    return this;
  }

  /**
   * Applies pagination to a collection query.
   */
  page(param: PageParam): this {
    this._expression.page = this.$pageParamToSpecifier(param);
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
  filter(...params: FilterParam<RI>[]): this {
    const specifiers = params.map((p) => this.$filterParamToSpecifier(p));
    this._expression.filter = (this._expression.filter ?? []).concat(
      specifiers
    );
    return this;
  }

  $filterParamToSpecifier(param: FilterParam<RI>): FilterSpecifier {
    let specifier: FilterSpecifier | undefined;

    if (isFilterSpecifier<RI>(param)) {
      specifier = param;
    } else {
      const op = param.op ?? 'equal';
      if (isAttributeFilterParam(param)) {
        const { attribute, value } = param;
        specifier = {
          kind: 'attribute',
          op,
          attribute,
          value
        } as AttributeFilterSpecifier;
      } else if (isRelatedRecordFilterParam<RI>(param)) {
        const { relation } = param;
        let record: RecordIdentity[] | RecordIdentity | null;
        if (Array.isArray(param.record)) {
          record = param.record.map((ri) =>
            this.$queryBuilder.$normalizeRecordIdentity(ri)
          );
        } else if (param.record) {
          record = this.$queryBuilder.$normalizeRecordIdentity(param.record);
        } else {
          record = null;
        }
        specifier = {
          kind: 'relatedRecord',
          op,
          relation,
          record
        } as RelatedRecordFilterSpecifier;
      } else if (isRelatedRecordsFilterParam<RI>(param)) {
        const { relation } = param;
        let records = param.records.map((ri) =>
          this.$queryBuilder.$normalizeRecordIdentity(ri)
        );
        specifier = {
          kind: 'relatedRecords',
          op,
          relation,
          records
        } as RelatedRecordsFilterSpecifier;
      }
    }

    if (specifier === undefined) {
      throw new ValidationError(
        'Unrecognized `filter` param encountered while building query expression'
      );
    }

    return specifier;
  }

  $pageParamToSpecifier(param: PageParam): PageSpecifier {
    let specifier: PageSpecifier | undefined;

    if (param.hasOwnProperty('offset') || param.hasOwnProperty('limit')) {
      specifier = {
        kind: 'offsetLimit',
        offset: param.offset,
        limit: param.limit
      };
    }

    if (specifier === undefined) {
      throw new ValidationError(
        'Unrecognized `page` param encountered while building query expression'
      );
    }

    return specifier;
  }

  $sortParamToSpecifier(param: SortParam): SortSpecifier {
    let specifier: SortSpecifier | undefined;

    if (isObject(param)) {
      if (param.hasOwnProperty('kind')) {
        specifier = param as SortSpecifier;
      } else if (param.hasOwnProperty('attribute')) {
        specifier = {
          kind: 'attribute',
          attribute: (param as AttributeSortParam).attribute,
          order: (param as AttributeSortParam).order || 'ascending'
        } as AttributeSortSpecifier;
      }
    } else if (typeof param === 'string') {
      specifier = this.$parseSortParamString(param);
    }

    if (specifier === undefined) {
      throw new ValidationError(
        'Unrecognized `sort` param encountered while building query expression'
      );
    }

    return specifier;
  }

  $parseSortParamString(sortSpecifier: string): AttributeSortSpecifier {
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
}

export type RecordQueryTerm<RT = string, RI = RecordIdentity> =
  | FindRecordTerm<RT, RI>
  | FindRelatedRecordTerm<RT, RI>
  | FindRecordsTerm<RT, RI>;
