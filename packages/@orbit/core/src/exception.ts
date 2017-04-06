/**
 * Base exception class.
 * 
 * @export
 * @class Exception
 */
export class Exception {
  public message: string;
  public error: Error;
  public stack: string;

  /**
   * Creates an instance of Exception.
   * 
   * @param {string} message 
   * 
   * @memberOf Exception
   */
  constructor(message: string) {
    this.message = message;
    this.error = new Error(this.message);
    this.stack = this.error.stack;
  }
}

/**
 * Exception raised when an item does not exist in a log.
 * 
 * @export
 * @class NotLoggedException
 * @extends {Exception}
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
 * 
 * @export
 * @class OutOfRangeException
 * @extends {Exception}
 */
export class OutOfRangeException extends Exception {
  public value: number;

  constructor(value: number) {
    super(`Out of range: ${value}`);
    this.value = value;
  }
}
