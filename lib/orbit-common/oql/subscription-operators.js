import {
  addRecordOperation,
  removeRecordOperation
} from 'orbit-common/lib/operations';
import { eq } from 'orbit/lib/eq';
import { parseIdentifier } from 'orbit-common/lib/identifiers';

function filterByOql(operations, context, cache, oqlExpression) {
  return Rx.Observable.create(function (observer) {
    const members = {};

    function addRecord(record) {
      members[record.id] = true;
      observer.onNext(addRecordOperation(record));
    }

    function removeRecord(record) {
      delete members[record.id];
      observer.onNext(removeRecordOperation(record));
    }

    operations.subscribe(
      operation => {
        const [ type, recordId ] = operation.path;
        const record = cache.get([type, recordId]);
        const existingMember = !!members[recordId];

        if (!record) {
          if (existingMember) {
            removeRecord({ type, id: recordId });
          }
        } else {
          context.currentObject = record;
          const matches = context.evaluate(oqlExpression);

          if (matches && !existingMember) {
            addRecord(record);
          } else if (!matches && existingMember) {
            removeRecord(record);
          } else if (matches && existingMember) {
            observer.onNext(operation);
          } else if (!matches && !existingMember) {
            return; // emit nothing
          } else {
            throw new Error('not handled');
          }
        }
      },
      error => {
        observer.onError(error);
      },
      () => {
        observer.onCompleted();
      }
    );
  });
}


var recordsOfType = {
  op: 'recordsOfType',
  evaluate(context, [type]) {
    return context.evaluator.target.patches.filter(operation => {
      return operation.path[0] === type;
    });
  }
};

var filter = {
  op: 'filter',
  evaluate(context, [operationsExpression, filterExpression]) {
    const cache = context.evaluator.target;
    const operations = context.evaluate(operationsExpression);

    return filterByOql(operations, context, cache, filterExpression);
  }
};

var get = {
  op: 'get',
  evaluate(context, args) {
    const path = args[0].split('/');

    return path.reduce((currentObject, segment) => {
      return currentObject && currentObject[segment];
    }, context.currentObject);
  }
};

var record = {
  op: 'record',
  evaluate(context, [type, recordId]) {
    return context.evaluator.target.patches.filter(operation => {
      return operation.path[0] === type && operation.path[1] === recordId;
    });
  }
};

var relatedRecord = {
  op: 'relatedRecord',
  evaluate(context, [type, recordId, relationship]) {
    return context.evaluator.target.patches
      .filter(operation =>
        eq(operation.path, [type, recordId, 'relationships', relationship, 'data'])
      )
      .scan((previous, operation) => {
        if (!operation.value) { return removeRecordOperation(previous.value); }

        const identifier = parseIdentifier(operation.value);
        const record = context.evaluator.target.get([identifier.type, identifier.id]);
        return addRecordOperation(record);
      }, null);
  }
};

export default {
  recordsOfType,
  relatedRecord,
  record,
  filter,
  get
};
