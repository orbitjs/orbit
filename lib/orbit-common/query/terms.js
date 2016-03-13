import { queryExpression as oqe } from 'orbit/query/expression';
import {
  Cursor,
  TermBase
} from 'orbit/query/terms';

export class RecordCursor extends Cursor {
  attribute(name) {
    return this.get(`attributes/${name}`);
  }
}

export class Record extends TermBase {
  constructor(type, id) {
    super();
    this._oqe = oqe('record', type, id);
  }

  build() {
    return this._oqe;
  }
}

export class Records extends TermBase {
  filter(predicateExpression) {
    const filterBuilder = new RecordCursor();
    return new this.constructor(oqe('filter', this.expression, predicateExpression(filterBuilder)));
  }

  filterAttributes(attributeValues) {
    const attributeExpressions = Object.keys(attributeValues).map(attribute => {
      return oqe('equal',
               oqe('get', `attributes/${attribute}`),
               attributeValues[attribute]);
    });

    const andExpression = attributeExpressions.length === 1 ? attributeExpressions[0]
                                                            : oqe('and', ...attributeExpressions);

    return new this.constructor(oqe('filter', this.expression, andExpression));
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
