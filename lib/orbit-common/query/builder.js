import { merge } from 'orbit/lib/objects';
import OrbitQueryBuilder from 'orbit/query/builder';
import { Records } from 'orbit-common/query/terms';
import Operators from './operators';

function _createTypeTerms(typeOptions) {
  if (!typeOptions) { return {}; }

  const typeTerms = {};

  Object.keys(typeOptions).forEach(type => {
    const scopes = typeOptions[type];
    typeTerms[type] = Records.withScopes(scopes);
  });

  return typeTerms;
}

export default class QueryBuilder extends OrbitQueryBuilder {
  constructor(options = {}) {
    super(options);

    this.operators = merge(this.operators, Operators);

    if (options.operators) {
      this.operators._typeTerms = _createTypeTerms(options.operators.recordsOfType);
    } else {
      this.operators._typeTerms = {};
    }
  }
}
