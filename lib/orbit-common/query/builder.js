import { merge } from 'orbit/lib/objects';
import OrbitQueryBuilder from 'orbit/query/builder';
import Operators from './operators';

export default class QueryBuilder extends OrbitQueryBuilder {
  constructor(options = {}) {
    super(options);

    this.operators = merge(this.operators, Operators);
    this.operators._terms = merge(this.operators._terms || {}, options.terms || {});
  }
}
