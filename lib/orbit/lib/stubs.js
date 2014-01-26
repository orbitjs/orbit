/**
 * @method noop
 * @for Orbit
 * @description

 Empty method that does nothing.

 Use as a placeholder for non-required static methods.

 */
var noop = function() {};

/**
 * @method required
 * @for Orbit
 * @description

 Empty method that should be overridden. Otherwise, it will throw an Error.

 Use as a placeholder for required static methods.

 */
var required = function() { throw new Error("Missing implementation"); };

export { noop, required };