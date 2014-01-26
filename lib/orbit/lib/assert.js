/**
 * @method assert
 * @for Orbit
 * @description

 Throw an exception if `test` is not truthy.

 * @param desc Description of the error thrown
 * @param test Value that should be truthy for assertion to pass
 */
var assert = function(desc, test) {
  if (!test) throw new Error("Assertion failed: " + desc);
};

export { assert };
