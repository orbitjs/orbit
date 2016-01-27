import { queryExpression as oqe } from 'orbit/query/expression';
import {
  Cursor,
  TermBase
} from 'orbit/query/terms';

class RecordCursor extends Cursor {
  attribute(name) {
    return this.get(`attributes/${name}`);
  }
}

class Records extends TermBase {
  filter(predicateExpression) {
    const filterBuilder = new RecordCursor();
    return new this.constructor(oqe('filter', this._oqe, predicateExpression(filterBuilder)));
  }

  filterAttributes(attributeValues) {
    const attributeExpressions = Object.keys(attributeValues).map(attribute => {
      return oqe('equal',
               oqe('get', `attributes/${attribute}`),
               attributeValues[attribute]);
    });

    const andExpression = attributeExpressions.length === 1 ? attributeExpressions[0]
                                                            : oqe('and', ...attributeExpressions);

    return new this.constructor(oqe('filter', this._oqe, andExpression));
  }

  build() {
    return this._oqe;
  }

  static withScopes(scopes) {
    const typeTerm = function(oqe) {
      Records.call(this, oqe);
    };

    typeTerm.prototype = Object.create(Records.prototype);
    Object.assign(typeTerm.prototype, scopes);

    return typeTerm;
  }
}

export {
  RecordCursor,
  Records
};
