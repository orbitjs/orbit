import { deepGet, merge, every, some } from '@orbit/utils';
import { RecordNotFoundException } from '@orbit/data';

const EMPTY = () => {};

export default {
  and(context, ...expressions) {
    return every(expressions, (exp) => this.evaluate(exp, context));
  },

  or(context, ...expressions) {
    return some(expressions, (exp) => this.evaluate(exp, context));
  },

  equal(context, ...expressions) {
    let value = EMPTY;

    return every(expressions, (expression) => {
      if (value === EMPTY) {
        value = this.evaluate(expression, context);
        return true;
      }

      return value === this.evaluate(expression, context);
    });
  },

  filter(context, select, where) {
    let values = this.evaluate(select, context);
    let basePath = context.basePath;
    let eachContext;
    let matches = {};

    Object.keys(values).forEach(value => {
      eachContext = merge(context, {
        basePath: basePath.concat(value)
      });

      if (this.evaluate(where, eachContext)) {
        matches[value] = values[value];
      }
    });

    return matches;
  },

  sort(context, select, sortExpressions) {
    const values = this.evaluate(select, context);
    const keys = Object.keys(values);
    const basePath = context.basePath;

    const comparisonValues = keys.reduce((obj, key) => {
      obj[key] = sortExpressions.map(sortExpression => this.evaluate(
        sortExpression.field,
        merge(context, { basePath: basePath.concat(key) })
      ));
      return obj;
    }, {});

    const comparisonOrders = sortExpressions.map(
      sortExpression => sortExpression.order === 'descending' ? -1 : 1);

    keys.sort((key1, key2) => {
      const values1 = comparisonValues[key1];
      const values2 = comparisonValues[key2];
      for (let i = 0; i < sortExpressions.length; i++) {
        if (values1[i] < values2[i]) {
          return -comparisonOrders[i];
        }
        if (values1[i] > values2[i]) {
          return comparisonOrders[i];
        }
      }
      return 0;
    });

    return keys.map(key => values[key]);
  },

  record(context, { type, id }) {
    const cache = this.target;
    const record = cache.records(type).get(id);

    if (!record) {
      throw new RecordNotFoundException(type, id);
    }

    return record;
  },

  records(context, type) {
    const cache = this.target;
    const records = cache.records(type).values;
    const results = {};

    records.forEach(record => results[record.id] = record);

    context.basePath = [type];

    return results;
  },

  relatedRecords(context, record, relationship) {
    const cache = this.target;
    const { type, id } = record;
    const currentRecord = cache.records(type).get(id);
    const data = currentRecord && deepGet(currentRecord, ['relationships', relationship, 'data']);
    const results = {};

    Object.keys(data || {}).forEach(identifier => {
      const [relType, relId] = identifier.split(':');
      results[relId] = cache.records(relType).get(relId);
    });

    return results;
  },

  relatedRecord(context, record, relationship) {
    const cache = this.target;
    const { type, id } = record;
    const currentRecord = cache.records(type).get(id);
    const data = currentRecord && deepGet(currentRecord, ['relationships', relationship, 'data']);

    if (!data) { return null; }

    const [relType, relId] = data.split(':');
    return cache.records(relType).get(relId);
  },

  attribute(context, name) {
    const [type, id] = context.basePath;
    const record = this.target.records(type).get(id);
    return record && deepGet(record, ['attributes', name]);
  }
};
