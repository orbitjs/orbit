import { Class } from 'orbit/lib/objects';
import { queryExpression as oqe } from 'orbit-common/oql/expressions';
import OrbitQueryBuilder from 'orbit/query-builder';
import {
  TermBase,
  Cursor
} from 'orbit/query-builder/terms';
import {
  RecordCursor,
  Records
} from 'orbit-common/query-builder/terms';

class QueryBuilder extends OrbitQueryBuilder {
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

export default QueryBuilder;
