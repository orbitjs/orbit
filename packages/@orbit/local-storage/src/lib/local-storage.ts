import { Orbit } from '@orbit/core';

export function supportsLocalStorage(): boolean {
  return !!Orbit.globals.localStorage;
}
