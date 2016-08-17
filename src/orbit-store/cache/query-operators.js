import { merge } from 'orbit/lib/objects';
import { every, some } from 'orbit/lib/arrays';
import { RecordNotFoundException } from 'orbit-common/lib/exceptions';

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

  record(context, { type, id }) {
    const cache = this.target;
    const schema = cache.schema;

    schema.ensureModelTypeInitialized(type);

    const record = cache.get([type, id]);

    if (!record) {
      throw new RecordNotFoundException(`Record not found ${type}:${id}`);
    }

    return record;
  },

  records(context, type) {
    const cache = this.target;
    const schema = cache.schema;

    schema.ensureModelTypeInitialized(type);

    const records = cache.get([type]);

    context.basePath = [type];

    return records || [];
  },

  relatedRecords(context, record, relationship) {
    const cache = this.target;
    const data = cache.get([record.type, record.id, 'relationships', relationship, 'data']);
    const results = {};

    Object.keys(data || {}).forEach(identifier => {
      const [type, id] = identifier.split(':');
      results[id] = cache.get([type, id]);
    });

    return results;
  },

  relatedRecord(context, record, relationship) {
    const cache = this.target;
    const data = cache.get([record.type, record.id, 'relationships', relationship, 'data']);

    if (!data) { return null; }

    const [relatedType, relatedRecordId] = data.split(':');
    return { [relatedRecordId]: cache.get([relatedType, relatedRecordId]) };
  },

  attribute(context, name) {
    const path = (context.basePath || []).concat(['attributes', name]);
    return this.target.get(path);
  }
};
