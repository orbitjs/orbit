import { Class } from 'orbit/lib/objects';
import { queryExpression as oqe } from 'orbit-common/oql/expressions';

class TermBase {
  constructor(oqe) {
    this._oqe = oqe;
  }
}

class Cursor extends TermBase {
  get(path) {
    return new Value(oqe('get', path));
  }

  attribute(name) {
    return this.get(`attributes/${name}`);
  }
}

class Value extends TermBase {
  equal(value) {
    return oqe('equal', this._oqe, value);
  }
}

class Records extends TermBase {
  filter(predicateExpression) {
    const filterBuilder = new Cursor();
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

class QueryBuilder {
  constructor(options = {}) {
    options.terms = options.terms || {};
    this._typeTerms = this._createTypeTerms(options.terms.recordsOfType);

    this._options = options;
  }

  recordsOfType(type) {
    const TypeTerm = this._typeTerms[type] || Records;

    return new TypeTerm(oqe('recordsOfType', type));
  }

  _createTypeTerms(typeOptions) {
    if (!typeOptions) { return {}; }

    const typeTerms = {};

    Object.keys(typeOptions).forEach(type => {
      const scopes = typeOptions[type];
      typeTerms[type] = Records.withScopes(scopes);
    });

    return typeTerms;
  }

  // should probably go somewhere else
  or(a, b) {
    return oqe('or', a, b);
  }

  and(a, b) {
    return oqe('and', a, b);
  }
}

export default QueryBuilder;
