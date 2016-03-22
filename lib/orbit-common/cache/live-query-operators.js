import { eq } from 'orbit/lib/eq';
import { parseIdentifier } from 'orbit-common/lib/identifiers';
import { queryExpression as oqe } from 'orbit/query/expression';
import { toIdentifier, eqIdentity } from 'orbit-common/lib/identifiers';
import Query from 'orbit/query';

function extractRecordFromHasOne(value) {
  if (!value) { return null; }

  const id = Object.keys(value)[0];
  return value[id];
}

function addRecordOperation(record) {
  return { op: 'addRecord', record };
}

function removeRecordOperation(record) {
  return { op: 'removeRecord', record };
}

export default {
  recordsOfType(context, type) {
    return this.target.patches.filter(operation => {
      return operation.record.type === type;
    });
  },

  relatedRecord(context, type, recordId, relationship) {
    const patches = this.target.patches;
    const currentValue = this.target.query(oqe('relatedRecord', type, recordId, relationship));
    const initialMember = extractRecordFromHasOne(currentValue);
    const initialOperation = initialMember ? addRecordOperation(initialMember) : Rx.Observable.empty();

    const membershipChanges = patches
      .filter(operation =>
        operation.op === 'replaceHasOne' &&
        operation.record.type === type &&
        operation.record.id === recordId &&
        operation.relationship === relationship
      )
      .scan((previous, operation) => {
        if (operation.relatedRecord) { return addRecordOperation(operation.relatedRecord); }
        if (previous.record) { return removeRecordOperation(previous.record); }
        return operation;
      }, initialOperation)
      .tap(operation => console.log('membershipChange', operation));

    const currentMember = membershipChanges
      .scan((member, operation) => operation.value, initialMember);

    const memberUpdates = currentMember.flatMap(member => {
      if (member) {
        return this.evaluate(oqe('record', member.type, member.id));
      } else {
        return Rx.Observable.empty();
      }
    });

    const membershipChangesWithoutInitialOperation = membershipChanges.filter(
      operation => operation !== initialOperation
    );

    return Rx.Observable.concat(membershipChangesWithoutInitialOperation, memberUpdates);
  },

  relatedRecords(context, type, recordId, relationship) {
    const patches = this.target.patches;
    const initialMembersMap = this.target.query(oqe('relatedRecords', type, recordId, relationship));
    const initialMembers = Object.keys(initialMembersMap).map(id => initialMembersMap[id]).map(record => `${record.type}:${record.id}`);

    const membershipChanges = patches
      .filter(operation =>
        ['addToHasMany', 'removeFromHasMany'].indexOf(operation.op) !== -1 &&
        operation.record.type === type &&
        operation.record.id === recordId &&
        operation.relationship === relationship
      )
      .map(operation => {
        const relatedRecord = operation.relatedRecord;

        switch (operation.op) {
          case 'addToHasMany': return addRecordOperation(relatedRecord);
          case 'removeFromHasMany': return removeRecordOperation(relatedRecord);
          default: throw new Error(`relatedRecords operator does not support: ${operation.op}`);
        }
      });

    const currentMembers = membershipChanges
      .scan((members, change) => {
        const record = change.record;
        const identifier = toIdentifier(record.type, record.id);

        if (change.op === 'addRecord') { members.push(identifier); }
        if (change.op === 'removeRecord') {
          const condemenedIndex = members.indexOf(identifier);
          if (condemenedIndex !== -1) { members.splice(condemenedIndex, 1); }
        }

        return members;
      }, initialMembers);

    const memberUpdates = currentMembers.flatMap(members => {
      return members.map(member => this.evaluate(oqe('record', ...member.split(':'))));
    }).concatAll();

    return Rx.Observable.concat(membershipChanges, memberUpdates);
  },

  record(context, record) {
    return this.target.patches.filter(operation => {
      return eqIdentity(operation.record, record);
    });
  },

  filter(context, operationsExpression, filterExpression) {
    const cache = this.target;
    const operations = this.evaluate(operationsExpression);

    return Rx.Observable.create(function(observer) {
      const members = {};

      function addRecord(record) {
        members[record.id] = record;
        observer.onNext(addRecordOperation(record));
      }

      function removeRecord(record) {
        record = members[record.id];
        delete members[record.id];
        observer.onNext(removeRecordOperation(record));
      }

      operations.subscribe(
        operation => {
          const { type, id: recordId } = operation.record;
          const record = cache.get([type, recordId]);
          const existingMember = !!members[recordId];

          if (!record) {
            if (existingMember) {
              removeRecord({ type, id: recordId });
            }
          } else {
            context.basePath = [type, recordId];
            const matches = cache.query(new Query(filterExpression), context);

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
};
