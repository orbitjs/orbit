import { RecordIdentity } from './record';

export type SortOrder = 'ascending' | 'descending';

export interface BaseSortSpecifier {
  kind: string;
  order: SortOrder;
}

export interface AttributeSortSpecifier extends BaseSortSpecifier {
  kind: 'attribute';
  attribute: string;
}

export type SortSpecifier = BaseSortSpecifier | AttributeSortSpecifier;

export type ValueComparisonOperator = 'equal' | 'gt' | 'lt' | 'gte' | 'lte';
export type SetComparisonOperator = 'equal' | 'all' | 'some' | 'none';

export interface BaseFilterSpecifier {
  kind: string;
  op: ValueComparisonOperator | SetComparisonOperator;
}

export interface AttributeFilterSpecifier extends BaseFilterSpecifier {
  kind: 'attribute';
  op: ValueComparisonOperator;
  attribute: string;
  value: any;
}

export interface RelatedRecordFilterSpecifier extends BaseFilterSpecifier {
  kind: 'relatedRecord';
  op: SetComparisonOperator;
  relation: string;
  record: RecordIdentity | RecordIdentity[] | null;
}

export interface RelatedRecordsFilterSpecifier extends BaseFilterSpecifier {
  kind: 'relatedRecords';
  op: SetComparisonOperator;
  relation: string;
  records: RecordIdentity[];
}

export type FilterSpecifier =
  | BaseFilterSpecifier
  | AttributeFilterSpecifier
  | RelatedRecordFilterSpecifier
  | RelatedRecordsFilterSpecifier;

export interface BasePageSpecifier {
  kind: string;
}

export interface OffsetLimitPageSpecifier extends BasePageSpecifier {
  kind: 'offsetLimit';
  offset?: number;
  limit?: number;
}

export type PageSpecifier = BasePageSpecifier | OffsetLimitPageSpecifier;

/**
 * An interface to represent a query expression.
 *
 * @export
 * @interface QueryExpression
 */
export interface QueryExpression {
  op: string;
}

export interface FindRecord extends QueryExpression {
  op: 'findRecord';
  record: RecordIdentity;
}

export interface FindRelatedRecord extends QueryExpression {
  op: 'findRelatedRecord';
  record: RecordIdentity;
  relationship: string;
}

export interface FindRelatedRecords extends QueryExpression {
  op: 'findRelatedRecords';
  record: RecordIdentity;
  relationship: string;
  sort?: SortSpecifier[];
  filter?: FilterSpecifier[];
  page?: PageSpecifier;
}

export interface FindRecords extends QueryExpression {
  op: 'findRecords';
  records?: RecordIdentity[];
  type?: string;
  sort?: SortSpecifier[];
  filter?: FilterSpecifier[];
  page?: PageSpecifier;
}
