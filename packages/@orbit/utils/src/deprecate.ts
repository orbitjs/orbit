declare const console: any;

/**
 * Display a deprecation warning with the provided message.
 * 
 * @export
 * @param {string} message Description of the deprecation
 * @param {(() => boolean | boolean)} test An optional boolean or function that evaluates to a boolean.
 * @returns 
 */
export function deprecate(message: string, test?: () => boolean | boolean) {
  if (typeof test === 'function') {
    if (test()) { return; }
  } else {
    if (test) { return; }
  }
  console.warn(message);
}
