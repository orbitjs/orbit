import { deprecate } from './deprecate';

/**
 * Base exception class.
 */
export class Exception extends Error {
  /**
   * A synonym for message.
   *
   * @deprecated since v0.17, access `message` instead
   */
  public get description(): string {
    deprecate(
      "'Exception#description' has been deprecated. Please access 'message' instead."
    );
    return this.message;
  }
}

/**
 * Exception raised when an item does not exist in a log.
 */
export class NotLoggedException extends Exception {
  public id: string;

  constructor(id: string) {
    super(`Action not logged: ${id}`);
    this.id = id;
  }
}

/**
 * Exception raised when a value is outside an allowed range.
 */
export class OutOfRangeException extends Exception {
  public value: number;

  constructor(value: number) {
    super(`Out of range: ${value}`);
    this.value = value;
  }
}

export class Assertion extends Exception {
  constructor(message: string) {
    super(`Assertion failed: ${message}`);
  }
}
