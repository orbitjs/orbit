import { RequestOptions } from './request';

export interface QueryExpression {
  op: string;
  options?: RequestOptions;
}
