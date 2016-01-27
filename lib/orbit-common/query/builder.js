import { queryExpression as oqe } from 'orbit/query/expression';
import OrbitQueryBuilder from 'orbit/query/builder';
import { Records } from 'orbit-common/query/terms';

export default class QueryBuilder extends OrbitQueryBuilder {
  constructor(options = {}) {
    super(options);
    this._typeTerms = this._createTypeTerms(options.terms.recordsOfType);
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
}
