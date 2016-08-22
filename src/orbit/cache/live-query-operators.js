import { queryExpression as oqe } from '../query/expression';
import Query from '../query';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/concat';

function addRecordOperation(record) {
  return { op: 'addRecord', record };
}

function removeRecordOperation(record) {
  return { op: 'removeRecord', record };
}

export default {
  records(context, type) {
    return this.target.patches.matching({ record: { type } });
  },

  relatedRecord(context, recordIdentity, relationship) {
    const hasOne = this.target.patches.forHasOne(recordIdentity, relationship);
    const changes = hasOne.relationshipChanges();
    const patches = hasOne.relatedRecord({ initial: true }).patches();

    return changes.concat(patches);
  },

  relatedRecords(context, recordIdentity, relationship) {
    const hasMany = this.target.patches.forHasMany(recordIdentity, relationship);
    const changes = hasMany.relationshipChanges();
    const patches = hasMany.relatedRecords({ initial: true }).patches();

    return changes.concat(patches);
  },

  record(context, recordIdentity) {
    return this.target.patches.matching({ record: recordIdentity });
  },

  filter(context, operationsExpression, filterExpression) {
    const cache = this.target;
    const operations = this.evaluate(operationsExpression);

    return Observable.create(function(observer) {
      const members = cache.query(new Query(oqe('filter', operationsExpression, filterExpression)), context);

      function addRecord(record) {
        members[record.id] = record;
        observer.next(addRecordOperation(record));
      }

      function removeRecord(record) {
        record = members[record.id];
        delete members[record.id];
        observer.next(removeRecordOperation(record));
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
              observer.next(operation);
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
