import { Class } from 'orbit/lib/objects';
import { queryExpression as oqe } from 'orbit-common/oql/expressions';

class TermBase {
  constructor(oqe) {
    this._oqe = oqe;
  }
};

class Cursor extends TermBase {
  get(path) {
    return new Value(oqe('get', path));
  }

  attribute(name) {
    return this.get(`attributes/${name}`);
  }
};

class Value extends TermBase {
  equal(value) {
    return oqe('equal', this._oqe, value);
  }
};

class Records extends TermBase {
  filter(predicateExpression) {
    const filterBuilder = new Cursor();
    return new Records(oqe('filter', this._oqe, predicateExpression(filterBuilder)));
  }

  filterAttributes(attributeValues) {
    const attributeExpressions = Object.keys(attributeValues).map(attribute => {
      return oqe('equal',
               oqe('get', `attributes/${attribute}`),
               attributeValues[attribute]);
    });

    return new Records(oqe('filter', this._oqe, oqe('and', ...attributeExpressions)));
  }

  build() {
    return this._oqe;
  }
};

class QueryBuilder extends TermBase {
  recordsOfType(type) {
    return new Records(oqe('recordsOfType', type));
  }

  // should probably go somewhere else
  or(a, b) {
    return oqe('or', a, b);
  }

  and(a, b) {
    return oqe('and', a, b);
  }
};

export default QueryBuilder;
