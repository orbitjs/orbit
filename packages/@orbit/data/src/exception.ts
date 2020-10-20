import { Exception } from '@orbit/core';
import { Operation } from './operation';
import { Query } from './query';
import { QueryExpression } from './query-expression';
import { Transform } from './transform';

/**
 * An client-side error occurred while communicating with a remote server.
 */
export class ClientError extends Exception {
  public description: string;

  constructor(description: string) {
    super(`Client error: ${description}`);
    this.description = description;
  }
}

/**
 * A server-side error occurred while communicating with a remote server.
 */
export class ServerError extends Exception {
  public description: string;

  constructor(description: string) {
    super(`Server error: ${description}`);
    this.description = description;
  }
}

/**
 * A networking error occurred while attempting to communicate with a remote
 * server.
 */
export class NetworkError extends Exception {
  public description: string;

  constructor(description: string) {
    super(`Network error: ${description}`);
    this.description = description;
  }
}

/**
 * A query expression could not be parsed.
 */
export class QueryExpressionParseError extends Exception {
  public description: string;
  public expression?: QueryExpression;

  constructor(description: string, expression?: QueryExpression) {
    super(`Query expression parse error: ${description}`);
    this.description = description;
    this.expression = expression;
  }
}

/**
 * A query is invalid for a particular source.
 */
export class QueryNotAllowed extends Exception {
  public description: string;
  public query: Query<QueryExpression>;

  constructor(description: string, query: Query<QueryExpression>) {
    super(`Query not allowed: ${description}`);
    this.description = description;
    this.query = query;
  }
}

/**
 * A transform is invalid for a particular source.
 */
export class TransformNotAllowed extends Exception {
  public description: string;
  public transform: Transform<Operation>;

  constructor(description: string, transform: Transform<Operation>) {
    super(`Transform not allowed: ${description}`);
    this.description = description;
    this.transform = transform;
  }
}
