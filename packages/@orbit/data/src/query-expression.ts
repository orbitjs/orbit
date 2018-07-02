import { RecordIdentity } from './record';

export type SortOrder = 'ascending' | 'descending';

export interface SortSpecifier {
  kind: string;
  order: SortOrder;
}

export interface AttributeSortSpecifier extends SortSpecifier {
  kind: 'attribute';
  attribute: string;
}

export type ValueComparisonOperator = 'equal' | 'gt' | 'lt' | 'gte' | 'lte';
export type SetComparisonOperator = 'equal' | 'all' | 'some' | 'none';

export interface FilterSpecifier {
  op: ValueComparisonOperator | SetComparisonOperator;
  kind: string;
}

export interface AttributeFilterSpecifier extends FilterSpecifier {
  op: ValueComparisonOperator,
  kind: "attribute";
  attribute: string;
  value: any;
}

export interface RelatedRecordFilterSpecifier extends FilterSpecifier {
  op: SetComparisonOperator,
  kind: 'relatedRecord';
  relation: string;
  record: RecordIdentity | RecordIdentity[] | null;
}

export interface RelatedRecordsFilterSpecifier extends FilterSpecifier {
  op: SetComparisonOperator,
  kind: 'relatedRecords';
  relation: string;
  data: RecordIdentity[];
}

export interface PageSpecifier {
  kind: string;
}

export interface OffsetLimitPageSpecifier extends PageSpecifier {
  kind: 'offsetLimit';
  offset?: number;
  limit?: number;
}

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
}

export interface FindRecords extends QueryExpression {
  op: 'findRecords';
  type?: string;
  sort?: SortSpecifier[];
  filter?: FilterSpecifier[];
  page?: PageSpecifier;
}
