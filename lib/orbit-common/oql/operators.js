import {
  queryExpression as oqe
} from './expressions';
import {
  splitPath
} from 'orbit/lib/paths';

var andOperator = {
  evaluate(context, args) {
    for (let arg of args) {
      if (!context.evaluate(arg)) {
        return false;
      }
    }
    return true;
  }
};

var orOperator = {
  evaluate(context, args) {
    for (let arg of args) {
      if (!!context.evaluate(arg)) { return true; }
    }
    return false;
  }
};

var equalOperator = {
  evaluate(context, args) {
    let value;
    let valueSet = false;

    for (let arg of args) {
      if (!valueSet) {
        value = context.evaluate(arg);
        valueSet = true;
      } else if (value !== context.evaluate(arg)) {
        return false;
      }
    }

    return true;
  }
};

var getOperator = {
  evaluate(context, args) {
    let path = splitPath(args[0]);
    if (context.basePath) {
      path = context.basePath.concat(path);
    }
    return context.evaluator.target.get(path);
  }
};

var filterOperator = {
  evaluate(context, args) {
    const path = splitPath(args[0]);
    const where = args[1];
    const values = context.evaluate(oqe('get', path));
    let matches = {};

    for (let value of Object.keys(values)) {
      context.basePath = path.concat(value);

      if (context.evaluate(where)) {
        matches[value] = values[value];
      }
    }

    return matches;
  }
};

var relatedRecordsOperator = {
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

var relatedRecordOperator = {
  evaluate(context, [type, recordId, relationship]) {
    const cache = context.evaluator.target;
    const data = cache.get([type, recordId, 'relationships', relationship, 'data']);

    if (!data) { return null; }

    const [relatedType, relatedRecordId] = data.split(':');
    return { [relatedRecordId]: cache.get([relatedType, relatedRecordId]) };
  }
};

export {
  andOperator,
  orOperator,
  equalOperator,
  getOperator,
  filterOperator,
  relatedRecordsOperator,
  relatedRecordOperator
};
