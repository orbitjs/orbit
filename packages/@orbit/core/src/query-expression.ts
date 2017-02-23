import { isObject } from './utils/objects';

export const QUERY_EXPRESSION = '__oqe__';

export interface QueryExpression {
  __oqe__: true;
  op: string;
  args: any[];  
}

export function queryExpression(op: string, ...args: any[]): QueryExpression {
  return {
    __oqe__: true,
    op,
    args
  };
}

export function isQueryExpression(obj: any): boolean {
  return isObject(obj) && obj[QUERY_EXPRESSION];
}
