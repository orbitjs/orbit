/**
 Base Exception

 @class Exception
 @constructor
 */
export class Exception {
  public message: string;
  public error: Error;
  public stack: string;

  constructor(message: string) {
    this.message = message;
    this.error = new Error(this.message);
    this.stack = this.error.stack;
  }
}

export class NotLoggedException extends Exception {
  public id: string;

  constructor(id: string) {
    super(`Action not logged: ${id}`);
    this.id = id;
  }
}

export class OutOfRangeException extends Exception {
  public value: number;

  constructor(value: number) {
    super(`Out of range: ${value}`);
    this.value = value;
  }
}
