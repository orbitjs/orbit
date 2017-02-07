/**
 Throw an exception if `test` is not truthy.

 @method assert
 @param description Description of the error thrown
 @param test Value that should be truthy for assertion to pass
 */
export function assert(description: string, test: boolean): void {
  if (!test) { throw new Error('Assertion failed: ' + description); }
}
