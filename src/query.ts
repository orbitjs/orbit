/* eslint-disable valid-jsdoc */
import { uuid } from './lib/uuid';
import { Dict } from './lib/dict';
import { QueryExpression, isQueryExpression } from './query-expression';
import { QueryTerm } from './query-term';

export interface QueryOptions {
  id?: string;
  sources?: any;
}

/**
 Queries are used to extract data from a source.

 Queries are automatically assigned a UUID `id`.

 @class Query
 @param {Object}    [expression] Query expression
 @param {Object}    [options]
 @param {String}    [options.id] Unique id for this query (will be assigned a uuid by default)
 @param {Object}    [options.sources] Optional. Instructions for specific sources to refine the
                    query, keyed by source name.
 @constructor
 */
export default class Query {
  id: string;
  expression: QueryExpression;
  sources: Dict<any>;

  constructor(expression: QueryExpression, options: QueryOptions = {}) {
    this.expression = expression;
    this.id = options.id || uuid();
    this.sources = options.sources || {};
  }

  static from(queryOrExpression: Query | QueryExpression | QueryTerm, options: QueryOptions): Query {
    if (queryOrExpression instanceof QueryTerm) {
      return new Query(queryOrExpression.toQueryExpression(), options);
    } else if (queryOrExpression instanceof Query) {
      return queryOrExpression;
    } else {
      return new Query(queryOrExpression, options);
    }
  }
}
