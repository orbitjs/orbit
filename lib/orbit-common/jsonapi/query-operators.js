import JSONAPIQuery from 'orbit-common/jsonapi/jsonapi-query';
import { assert } from 'orbit/lib/assert';

export default {
  recordsOfType(context, type) {
    const urlBuilder = this.target;
    return new JSONAPIQuery(type, urlBuilder);
  },

  filter(context, jsonApiQueryExpression, predicateFunction) {
    const jsonApiQuery = this.evaluate(jsonApiQueryExpression);
    const filter = this.evaluate(predicateFunction);

    return jsonApiQuery.addFilter(filter);
  },

  equal(context, pathExpression, valueExpression) {
    assert(pathExpression.op === 'get', 'left side must be a get');
    assert(valueExpression, 'should restrict to values allowed in url filters');

    const attributeName = pathExpression.args[0].match(/attributes\/(.*)/)[1];

    return { [attributeName]: valueExpression };
  },

  and(context, expressions) {
    return expressions.reduce((merged, filter) => Object.assign(merged, filter), {});
  },

  or() {
    throw new Error('not supported');
  }
};
