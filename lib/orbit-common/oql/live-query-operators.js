import {
  addRecordOperation,
  removeRecordOperation,
  operationType
} from 'orbit-common/lib/operations';
import { eq } from 'orbit/lib/eq';
import { parseIdentifier } from 'orbit-common/lib/identifiers';
import {
  queryExpression as oqe
} from 'orbit-common/oql/expressions';
import { toIdentifier } from 'orbit-common/lib/identifiers';

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
          context.basePath = [type, recordId];
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
  evaluate(context, [type]) {
    return context.evaluator.target.patches.filter(operation => {
      return operation.path[0] === type;
    });
  }
};

var filter = {
  evaluate(context, [operationsExpression, filterExpression]) {
    const cache = context.evaluator.target;
    const operations = context.evaluate(operationsExpression);

    return filterByOql(operations, context, cache, filterExpression);
  }
};

var record = {
  evaluate(context, [type, recordId]) {
    return context.evaluator.target.patches.filter(operation => {
      return operation.path[0] === type && operation.path[1] === recordId;
    });
  }
};

function extractRecordFromHasOne(value) {
  if (!value) { return null; }

  const id = Object.keys(value)[0];
  return value[id];
}

var relatedRecord = {
  evaluate(context, [type, recordId, relationship]) {
    const patches = context.evaluator.target.patches;

    const currentValue = context.evaluate(oqe('query:relatedRecord', type, recordId, relationship));
    const initialMember = extractRecordFromHasOne(currentValue);
    const initialOperation = initialMember ? addRecordOperation(initialMember) : Rx.Observable.empty();

    const membershipChanges = patches
      .filter(operation => {
        return eq(operation.path, [type, recordId, 'relationships', relationship, 'data']);
      })
      .scan((previous, operation) => {
        if (operation.value) {
          const identifier = parseIdentifier(operation.value);
          const record = context.evaluator.target.get([identifier.type, identifier.id]);
          return addRecordOperation(record);
        } else {
          if (previous.value) { return removeRecordOperation(previous.value); }
        }
      }, initialOperation);

    const currentMember = membershipChanges
      .scan((member, operation) => operation.value, initialMember);

    const memberUpdates = currentMember.flatMap(member => {
      if (member) {
        return context.evaluate(oqe('record', member.type, member.id));
      } else {
        return Rx.Observable.empty();
      }
    });

    const membershipChangesWithoutInitialOperation = membershipChanges.filter(
      operation => operation !== initialOperation
    );

    return Rx.Observable.concat(membershipChangesWithoutInitialOperation, memberUpdates);
  }
};

var relatedRecords = {
  evaluate(context, [type, recordId, relationship]) {
    const patches = context.evaluator.target.patches;
    const initialMembersMap = context.evaluate(oqe('query:relatedRecords', type, recordId, relationship));
    const initialMembers = Object.keys(initialMembersMap).map(id => initialMembersMap[id]).map(record => `${record.type}:${record.id}`);

    const membershipChanges = patches
      .filter(operation =>
        eq(operation.path.slice(0, 4), [type, recordId, 'relationships', relationship])
      )
      .map(operation => {
        const recordIdentifier = operation.path[5];
        const record = context.evaluator.target.get(recordIdentifier.split(':'));

        switch (operationType(operation)) {
          case 'addToHasMany': return addRecordOperation(record);
          case 'removeFromHasMany': return removeRecordOperation(record);
          default: throw new Error(`relatedRecords operator does not support: ${operationType(operation)}`);
        }
      });

    const currentMembers = membershipChanges
      .scan((members, change) => {
        const identifier = toIdentifier(...change.path);

        if (change.op === 'add') { members.push(identifier); }
        if (change.op === 'remove') {
          const condemenedIndex = members.indexOf(identifier);
          if (condemenedIndex !== -1) { members.splice(condemenedIndex, 1); }
        }

        return members;
      }, initialMembers);

    const memberUpdates = currentMembers.flatMap(members => {
      return members.map(member => context.evaluate(oqe('record', ...member.split(':'))));
    }).concatAll();

    return Rx.Observable.concat(membershipChanges, memberUpdates);
  }
};

export default {
  recordsOfType,
  relatedRecord,
  relatedRecords,
  record,
  filter
};
