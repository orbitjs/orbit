import { uuid } from '@orbit/utils';
import { QueryExpression, isQueryExpression } from './query-expression';
import { QueryTerm } from './query-term';

export type QueryOrExpression = Query | QueryExpression | QueryTerm;

/**
 Queries are used to extract data from a source.

 Queries are automatically assigned a UUID `id`.

 @class Query
 @param {Object} [expression] Query expression
 @param {String} [id] Optional. Unique id for this query (will be assigned a uuid by default)
 @constructor
 */
export default class Query {
  id: string;
  expression: QueryExpression;
  options: any;

  constructor(expression: QueryExpression, options?: object, id: string = uuid()) {
    this.expression = expression;
    this.options = options;
    this.id = id;
  }

  static from(queryOrExpression: QueryOrExpression, options?: object, id?: string): Query {
    if (queryOrExpression instanceof Query) {
      if (options && options !== queryOrExpression.options ||
          id && id !== queryOrExpression.id) {
        return new Query(queryOrExpression.expression, options || queryOrExpression.options, id);
      } else {
        return queryOrExpression;
      }
    } else if (queryOrExpression instanceof QueryTerm) {
      return new Query(queryOrExpression.toQueryExpression(), options, id);
    } else {
      return new Query(queryOrExpression, options, id);
    }
  }
}
