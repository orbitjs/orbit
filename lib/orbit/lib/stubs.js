/**
 Empty method that does nothing.

 Use as a placeholder for non-required static methods.

 @method noop
 @for Orbit
 */
var noop = function() {};

/**
 Empty method that should be overridden. Otherwise, it will throw an Error.

 Use as a placeholder for required static methods.

 @method required
 @for Orbit
 */
var required = function() { throw new Error('Missing implementation'); };

export { noop, required };
