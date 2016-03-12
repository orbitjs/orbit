import { merge } from 'orbit/lib/objects';
import { queryExpression as oqe } from 'orbit/query/expression';
import OrbitQueryBuilder from 'orbit/query/builder';
import { Records } from 'orbit-common/query/terms';

function _createTypeTerms(typeOptions) {
  if (!typeOptions) { return {}; }

  const typeTerms = {};

  Object.keys(typeOptions).forEach(type => {
    const scopes = typeOptions[type];
    typeTerms[type] = Records.withScopes(scopes);
  });

  return typeTerms;
}

const defaultTerms = {
  recordsOfType(type) {
    const TypeTerm = this._typeTerms[type] || Records;

    return new TypeTerm(oqe('recordsOfType', type));
  }
};

export default class QueryBuilder extends OrbitQueryBuilder {
  constructor(options = {}) {
    super(options);

    this.terms = merge(this.terms, defaultTerms);

    if (options.terms) {
      this.terms._typeTerms = _createTypeTerms(options.terms.recordsOfType);
    } else {
      this.terms._typeTerms = {};
    }
  }
}
