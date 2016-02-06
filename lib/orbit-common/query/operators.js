import { queryExpression as oqe } from 'orbit/query/expression';
import {
  RecordNotFoundException,
  ModelNotRegisteredException
} from 'orbit-common/lib/exceptions';

const relatedRecordsOperator = {
  evaluate(context, [type, recordId, relationship]) {
    const cache = context.evaluator.target;
    const data = cache.get([type, recordId, 'relationships', relationship, 'data']);

    const results = {};

    Object.keys(data||{}).forEach(identifier => {
      const [type, id] = identifier.split(':');
      results[id] = cache.get([type, id]);
    });

    return results;
  }
};

const relatedRecordOperator = {
  evaluate(context, [type, recordId, relationship]) {
    const cache = context.evaluator.target;
    const data = cache.get([type, recordId, 'relationships', relationship, 'data']);

    if (!data) { return null; }

    const [relatedType, relatedRecordId] = data.split(':');
    return { [relatedRecordId]: cache.get([relatedType, relatedRecordId]) };
  }
};

const recordOperator = {
  evaluate(context, [type, recordId]) {
    const cache = context.evaluator.target;
    const record = cache.get([type, recordId]);

    if (!record) { throw new RecordNotFoundException(`Record not found ${type}:${recordId}`); }

    return record;
  }
};

const recordsOfTypeOperator = {
  evaluate(context, [type]) {
    const cache = context.evaluator.target;
    const schema = cache.schema;

    if (!schema.containsModel(type)) {
      throw new ModelNotRegisteredException(`No model registered for ${type}`);
    }

    const records = cache.get([type]) || {};

    return records;
  }
};

export {
  relatedRecordsOperator,
  relatedRecordOperator,
  recordOperator,
  recordsOfTypeOperator
};
