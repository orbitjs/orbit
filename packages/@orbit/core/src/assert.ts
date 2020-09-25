import { Assertion } from './exception';

/**
 * Throw an exception if `test` is not truthy.
 */
export function assert(description: string, test: boolean): void | never {
  if (!test) {
    throw new Assertion(description);
  }
}
