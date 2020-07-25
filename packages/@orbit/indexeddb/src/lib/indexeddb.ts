import { Orbit } from '@orbit/core';

export function supportsIndexedDB(): boolean {
  return !!Orbit.globals.indexedDB;
}
