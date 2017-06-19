import { Dict, isNone } from '@orbit/utils';
import Orbit, {
  QueryExpression,
  Transform,
  FindRecord,
  FindRecords
} from '@orbit/data';
import IndexedDBSource from '../source';

export interface PullOperator {
  (source: IndexedDBSource, expression: QueryExpression): Promise<Transform[]>;
}

export const PullOperators: Dict<PullOperator> = {
  findRecords(source: IndexedDBSource, expression: FindRecords): Promise<Transform[]> {
    const operations = [];

    let types = expression.type ? [expression.type] : source.availableTypes;

    return types.reduce((chain, type) => {
      return chain.then(() => {
        return source.getRecords(type)
          .then(records => {
            records.forEach(record => {
              operations.push({
                op: 'addRecord',
                record
              });
            });
          });
      });
    }, Orbit.Promise.resolve())
      .then(() => [Transform.from(operations)]);
  },

  findRecord(source: IndexedDBSource, expression: FindRecord): Promise<Transform[]> {
    return source.getRecord(expression.record)
      .then(record => {
        const operations = [{
          op: 'addRecord',
          record
        }];
        return [Transform.from(operations)];
      });
  }
};
