/**
 Display a deprecation warning with the provided message.

 @method deprecate
 @param {String} message Description of the deprecation
 @param {Boolean} test An optional boolean. If false, the deprecation will be displayed.
 */
export function deprecate(message: string, test: () => boolean | boolean) {
  if (typeof test === 'function') {
    if (test()) { return; }
  } else {
    if (test) { return; }
  }
  console.warn(message);
}
