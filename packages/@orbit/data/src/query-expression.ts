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

export type ComparisonOperator = 'equal' | 'gt' | 'lt' | 'gte' | 'lte';

export interface FilterSpecifier {
  op: ComparisonOperator;
  kind: string;
}

export interface AttributeFilterSpecifier extends FilterSpecifier {
  kind: 'attribute';
  attribute: string;
  value: any;
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
