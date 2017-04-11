import { isObject } from '@orbit/utils';

export const QUERY_EXPRESSION = '__oqe__';

/**
 * An interface to represent a query expression.
 * 
 * Query expressions consist of an `op`, or query operation, as well as `args`,
 * an array of arguments that have meaning specific to the operation.
 * 
 * Query arguments may in turn consist of query expressions. For that reason,
 * the `__oqe__` member is used to distinguish between query expressions and
 * plain values.
 * 
 * @export
 * @interface QueryExpression
 */
export interface QueryExpression {
  __oqe__: true;
  op: string;
  args: any[];
}

/**
 * Method to instantiate a query expression.
 * 
 * `oqe` is an abbreviation for "Orbit Query Expression".
 * 
 * @export
 * @param {string} op 
 * @param {...any[]} args 
 * @returns {QueryExpression} 
 */
export function oqe(op: string, ...args: any[]): QueryExpression {
  return {
    __oqe__: true,
    op,
    args
  };
}

/**
 * Does an object implement the `QueryExpression` interface?
 * 
 * @export
 * @param {*} obj 
 * @returns {boolean} 
 */
export function isQueryExpression(obj: any): boolean {
  return isObject(obj) && obj[QUERY_EXPRESSION];
}
