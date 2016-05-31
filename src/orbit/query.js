import { uuid } from './lib/uuid';
import { QueryBuilderNotRegisteredException } from './lib/exceptions';

/**
 Queries are used to extract data from a source.

 Queries are automatically assigned a UUID `id`.

 @class Query
 @namespace Orbit
 @param {Object}    [expression] Query expression
 @param {Object}    [options]
 @param {String}    [options.id] Unique id for this query (will be assigned a uuid by default)
 @constructor
 */
export default class Query {
  constructor(expression, _options) {
    this.expression = expression;

    let options = _options || {};

    this.id = options.id || uuid();
  }
}

Query.from = function(queryOrExpression, queryBuilder) {
  if (queryOrExpression.toQueryExpression) {
    return new Query(queryOrExpression.toQueryExpression());
  } else if (queryOrExpression instanceof Query) {
    return queryOrExpression;
  } else if (typeof queryOrExpression === 'function') {
    if (queryBuilder) {
      return queryBuilder.build(queryOrExpression);
    } else {
      throw new QueryBuilderNotRegisteredException();
    }
  } else {
    return new Query(queryOrExpression);
  }
};
