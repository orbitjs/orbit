import { Exception } from '@orbit/core';
import { Operation } from './operation';
import { Query } from './query';
import { QueryExpression } from './query-expression';
import { Transform } from './transform';

/**
 * A query expression could not be parsed.
 */
export class QueryExpressionParseError extends Exception {
  public expression?: QueryExpression;

  constructor(description: string, expression?: QueryExpression) {
    super(`Query expression parse error: ${description}`);
    this.expression = expression;
  }
}

/**
 * A query is invalid for a particular source.
 */
export class QueryNotAllowed extends Exception {
  public query: Query<QueryExpression>;

  constructor(description: string, query: Query<QueryExpression>) {
    super(`Query not allowed: ${description}`);
    this.query = query;
  }
}

/**
 * A transform is invalid for a particular source.
 */
export class TransformNotAllowed extends Exception {
  public transform: Transform<Operation>;

  constructor(description: string, transform: Transform<Operation>) {
    super(`Transform not allowed: ${description}`);
    this.transform = transform;
  }
}
