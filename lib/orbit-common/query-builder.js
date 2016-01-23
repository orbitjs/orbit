import { Class } from 'orbit/lib/objects';
import { queryExpression as oqe } from 'orbit-common/oql/expressions';

var Cursor = Class.extend({
  get(path) {
    return new Value(oqe('get', path));
  },

  attribute(name) {
    return this.get(`attributes/${name}`);
  }
});

var Value = Class.extend({
  init(oqe) {
    this._oqe = oqe;
  },

  equal(value) {
    return oqe('equal', this._oqe, value);
  }
});

var Records = Class.extend({
  init(oqe) {
    this._oqe = oqe;
  },

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

var QueryBuilder = Class.extend({
  init(oqe) {
    this._oqe = oqe;
  },

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
