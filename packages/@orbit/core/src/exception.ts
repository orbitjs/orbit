/**
 * Base exception class.
 */
export class Exception extends Error {}

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
