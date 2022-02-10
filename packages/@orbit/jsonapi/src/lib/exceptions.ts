import { Exception } from '@orbit/core';

/**
 * A client-side error occurred while communicating with a remote server.
 */
export class ClientError extends Exception {
  public data?: unknown;
  public response?: Response;

  constructor(description: string) {
    super(`Client error: ${description}`);
  }
}

/**
 * A server-side error occurred while communicating with a remote server.
 */
export class ServerError extends Exception {
  public data?: unknown;
  public response?: Response;

  constructor(description: string) {
    super(`Server error: ${description}`);
  }
}

/**
 * A network error occurred while attempting to communicate with a remote
 * server.
 */
export class NetworkError extends Exception {
  constructor(description: string) {
    super(`Network error: ${description}`);
  }
}

export class InvalidServerResponse extends Exception {
  public response: string;

  constructor(response: string) {
    super(`Invalid server response: ${response}`);
    this.response = response;
  }
}
