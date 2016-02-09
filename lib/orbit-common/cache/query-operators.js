import { merge } from 'orbit/lib/objects';
import { queryExpression as oqe } from 'orbit/query/expression';
import { splitPath } from 'orbit/lib/paths';
import {
  RecordNotFoundException,
  ModelNotRegisteredException
} from '../lib/exceptions';

export default {
  and(context, ...expressions) {
    for (let expression of expressions) {
      if (!this.evaluate(expression, context)) {
        return false;
      }
    }
    return true;
  },

  or(context, ...expressions) {
    for (let expression of expressions) {
      if (!!this.evaluate(expression, context)) { return true; }
    }
    return false;
  },

  equal(context, ...expressions) {
    let value;
    let valueSet = false;

    for (let expression of expressions) {
      if (!valueSet) {
        value = this.evaluate(expression, context);
        valueSet = true;
      } else if (value !== this.evaluate(expression, context)) {
        return false;
      }
    }

    return true;
  },

  get(context, path) {
    path = splitPath(path);
    if (context.basePath) {
      path = context.basePath.concat(path);
    }
    return this.target.get(path);
  },

  filter(context, path, where) {
    path = splitPath(path);

    let values = this.evaluate(oqe('get', path), context);
    let eachContext;
    let matches = {};

    for (let value of Object.keys(values)) {
      eachContext = merge(context, {
        basePath: path.concat(value)
      });

      if (this.evaluate(where, eachContext)) {
        matches[value] = values[value];
      }
    }

    return matches;
  },

  record(context, type, recordId) {
    const cache = this.target;
    const record = cache.get([type, recordId]);

    if (!record) {
      throw new RecordNotFoundException(`Record not found ${type}:${recordId}`);
    }

    return record;
  },

  recordsOfType(context, type) {
    const cache = this.target;
    const schema = cache.schema;

    if (!schema.containsModel(type)) {
      throw new ModelNotRegisteredException(`No model registered for ${type}`);
    }

    const records = cache.get([type]);

    return records;
  },

  relatedRecords(context, type, recordId, relationship) {
    const cache = this.target;
    const data = cache.get([type, recordId, 'relationships', relationship, 'data']);
    const results = {};

    Object.keys(data || {}).forEach(identifier => {
      const [type, id] = identifier.split(':');
      results[id] = cache.get([type, id]);
    });

    return results;
  },

  relatedRecord(context, type, recordId, relationship) {
    const cache = this.target;
    const data = cache.get([type, recordId, 'relationships', relationship, 'data']);

    if (!data) { return null; }

    const [relatedType, relatedRecordId] = data.split(':');
    return { [relatedRecordId]: cache.get([relatedType, relatedRecordId]) };
  }
};
