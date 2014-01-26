/**
 * Throw an exception if `test` is not truthy.
 *
 * @mathod assert
 * @param desc Description of the error thrown
 * @param test
 */
var assert = function(desc, test) {
  if (!test) throw new Error("Assertion failed: " + desc);
};

export { assert };
