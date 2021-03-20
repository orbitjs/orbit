import { Orbit } from '@orbit/core';
import { InitializedRecord } from '@orbit/records';
import { LocalStorageSource } from '../../src/local-storage-source';
import { LocalStorageCache } from '../../src/local-storage-cache';

export function getRecordFromLocalStorage(
  source: LocalStorageSource | LocalStorageCache,
  record: InitializedRecord
): InitializedRecord {
  const recordKey = [source.namespace, record.type, record.id].join(
    source.delimiter
  );
  return JSON.parse(Orbit.globals.localStorage.getItem(recordKey));
}

export function isLocalStorageEmpty(source: LocalStorageSource): boolean {
  let isEmpty = true;
  for (let key in Orbit.globals.localStorage) {
    if (key.indexOf(source.namespace + source.delimiter) === 0) {
      isEmpty = false;
      break;
    }
  }
  return isEmpty;
}
