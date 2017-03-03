import { Exception } from '@orbit/core';

export class InvalidServerResponse extends Exception {
  public response: string;

  constructor(response: string) {
    super(`Invalid server response: ${response}`);
    this.response = response;
  }
}
