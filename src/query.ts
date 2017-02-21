import { uuid } from './lib/uuid';
import { QueryExpression, isQueryExpression } from './query-expression';
import { QueryTerm } from './query-term';

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

  constructor(expression: QueryExpression, id: string = uuid()) {
    this.expression = expression;
    this.id = id;
  }

  static from(queryOrExpression: Query | QueryExpression | QueryTerm, id?: string): Query {
    if (queryOrExpression instanceof QueryTerm) {
      return new Query(queryOrExpression.toQueryExpression(), id);
    } else if (queryOrExpression instanceof Query) {
      return queryOrExpression;
    } else {
      return new Query(queryOrExpression, id);
    }
  }
}
