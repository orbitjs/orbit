/* eslint-disable valid-jsdoc */

/**
 Empty method that does nothing.

 Use as a placeholder for non-required static methods.

 @method noop
 @for Orbit
 */
export function noop() {}

/**
 Empty method that should be overridden. Otherwise, it will throw an Error.

 Use as a placeholder for required static methods.

 @method required
 @for Orbit
 */
export function required() { throw new Error('Missing implementation'); };
