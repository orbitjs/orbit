import { Class } from 'orbit/lib/objects';
import { queryExpression as oqe } from 'orbit-common/oql/expressions';

var TermBase = Class.extend({
  init(oqe) {
    this._oqe = oqe;
  }
});

var Cursor = Class.extend({
  get(path) {
    return new Value(oqe('get', path));
  },

  attribute(name) {
    return this.get(`attributes/${name}`);
  }
});

var Value = TermBase.extend({
  equal(value) {
    return oqe('equal', this._oqe, value);
  }
});

var Records = TermBase.extend({
  filter(predicateExpression) {
    const filterBuilder = new Cursor();
    return new Records(oqe('filter', this._oqe, predicateExpression(filterBuilder)));
  },

  filterAttributes(attributeValues) {
    const attributeExpressions = Object.keys(attributeValues).map(attribute => {
      return oqe('equal',
               oqe('get', `attributes/${attribute}`),
               attributeValues[attribute]);
    });

    return new Records(oqe('filter', this._oqe, oqe('and', ...attributeExpressions)));
  },

  build() {
    return this._oqe;
  }
});

var QueryBuilder = TermBase.extend({
  recordsOfType(type) {
    return new Records(oqe('recordsOfType', type));
  },

  // should probably go somewhere else
  or(a, b) {
    return oqe('or', a, b);
  },

  and(a, b) {
    return oqe('and', a, b);
  }
});

export default QueryBuilder;
