import { Orbit } from './main';
declare const console: any;

/**
 * Display a deprecation warning with the provided message if the
 * provided `test` evaluates to a falsy value (or is missing).
 */
export function deprecate(
  message: string,
  test?: boolean | (() => boolean)
): void {
  if (!Orbit.debug) return;

  if (typeof test === 'function') {
    if (test()) return;
  } else {
    if (test) return;
  }
  console.warn(message);
}
