/* eslint-disable valid-jsdoc */
import { uuid } from './lib/uuid';

/**
 Queries are used to extract data from a source.

 Queries are automatically assigned a UUID `id`.

 @class Query
 @namespace Orbit
 @param {Object}    [expression] Query expression
 @param {Object}    [options]
 @param {String}    [options.id] Unique id for this query (will be assigned a uuid by default)
 @param {Object}    [options.sources] Optional. Instructions for specific sources to refine the
                    query, keyed by source name.
 @constructor
 */
export default class Query {
  constructor(expression, _options) {
    this.expression = expression;

    let options = _options || {};

    this.id = options.id || uuid();
    this.sources = options.sources || {};
  }
}

Query.from = function(queryOrExpression, options) {
  if (queryOrExpression.toQueryExpression) {
    return new Query(queryOrExpression.toQueryExpression(), options);
  } else if (queryOrExpression instanceof Query) {
    return queryOrExpression;
  } else {
    return new Query(queryOrExpression, options);
  }
};
