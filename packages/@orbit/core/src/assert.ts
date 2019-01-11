/**
 * Throw an exception if `test` is not truthy.
 */
export function assert(description: string, test: boolean): void {
  if (!test) { throw new Error('Assertion failed: ' + description); }
}
