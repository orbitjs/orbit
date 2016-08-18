import Transform from 'orbit/transform';
import { isNone } from 'orbit/lib/objects';

export const QueryOperators = {
  records(source, expression) {
    const operations = [];
    let allowedTypes = expression.args;
    let skipTypeCheck = (allowedTypes.length === 0 || (allowedTypes.length === 1 && isNone(allowedTypes[0])));

    for (let key in self.localStorage) {
      if (key.indexOf(source.namespace) === 0) {
        let typesMatch = skipTypeCheck;

        if (!typesMatch) {
          let fragments = key.split(source.delimiter);
          let type = fragments[1];
          typesMatch = allowedTypes.indexOf(type) !== -1;
        }

        if (typesMatch) {
          let record = JSON.parse(self.localStorage.getItem(key));

          operations.push({
            op: 'addRecord',
            record
          });
        }
      }
    }

    return [Transform.from(operations)];
  },

  record(source, expression) {
    const operations = [];
    let requestedRecord = expression.args[0];

    for (let key in self.localStorage) {
      if (key.indexOf(source.namespace) === 0) {
        let fragments = key.split(source.delimiter);
        let type = fragments[1];
        let id = fragments[2];

        if (type === requestedRecord.type &&
            id === requestedRecord.id) {
          let record = JSON.parse(self.localStorage.getItem(key));

          operations.push({
            op: 'addRecord',
            record
          });

          break;
        }
      }
    }

    return [Transform.from(operations)];
  }
};
