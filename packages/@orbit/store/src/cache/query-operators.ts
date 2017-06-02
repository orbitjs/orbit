import { deepGet, merge, every, some } from '@orbit/utils';
import { RecordNotFoundException, QueryExpressionParseError } from '@orbit/data';

const EMPTY = () => {};

export const QueryOperators = {
  filter(select, where) {
    const records = this.evaluate(select);

    return records.filter(record => this.evaluate(where, record));
  },

  sort(select, sortExpressions) {
    const records = this.evaluate(select);
    const comparisonValues = new Map();

    records.forEach(record => {
      comparisonValues.set(
        record,
        sortExpressions.map(sortExpression => this.evaluate(
          sortExpression.field,
          record
        ))
      );
    });

    const comparisonOrders = sortExpressions.map(
      sortExpression => sortExpression.order === 'descending' ? -1 : 1);

    return records.sort((record1, record2) => {
      const values1 = comparisonValues.get(record1);
      const values2 = comparisonValues.get(record2);
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
  },

  page(select, paginationOptions) {
    const records = this.evaluate(select);

    if (paginationOptions.limit !== undefined) {
      let offset = paginationOptions.offset === undefined ? 0 : paginationOptions.offset;
      let limit = paginationOptions.limit;

      return records.slice(offset, offset + limit);

    } else {
      throw new QueryExpressionParseError('Pagination options not recognized for Store. Please specify `offset` and `limit`.', paginationOptions);
    }
  },

  record({ type, id }) {
    const cache = this.target;
    const record = cache.records(type).get(id);

    if (!record) {
      throw new RecordNotFoundException(type, id);
    }

    return record;
  },

  records(type) {
    return this.target.records(type).values;
  },

  relatedRecords(record, relationship) {
    const cache = this.target;
    const { type, id } = record;
    const currentRecord = cache.records(type).get(id);
    const data = currentRecord && deepGet(currentRecord, ['relationships', relationship, 'data']);
    const results = [];

    if (data) {
      Object.keys(data).forEach(identifier => {
        const [relType, relId] = identifier.split(':');
        results.push(cache.records(relType).get(relId));
      });
    }

    return results;
  },

  relatedRecord(record, relationship) {
    const cache = this.target;
    const { type, id } = record;
    const currentRecord = cache.records(type).get(id);
    const data = currentRecord && deepGet(currentRecord, ['relationships', relationship, 'data']);

    if (!data) { return null; }

    const [relType, relId] = data.split(':');
    return cache.records(relType).get(relId);
  }
};

export const ContextualQueryOperators = {
  and(context, ...expressions) {
    return every(expressions, (exp) => this.evaluate(exp, context));
  },

  or(context, ...expressions) {
    return some(expressions, (exp) => this.evaluate(exp, context));
  },

  equal(context, ...expressions) {
    let value = EMPTY;

    return every(expressions, (exp) => {
      if (value === EMPTY) {
        value = this.evaluate(exp, context);
        return true;
      }

      return value === this.evaluate(exp, context);
    });
  },

  attribute(context, name) {
    if (context.attributes) {
      return context.attributes[name];
    } else {
      const { type, id } = context;
      const record = this.target.records(type).get(id);
      return record && deepGet(record, ['attributes', name]);
    }
  }
};

