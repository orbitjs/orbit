import { deepGet, deepSet, firstResult, Dict } from '@orbit/utils';
import { Record } from './record';

/**
 * Maintains a map between records' ids and keys.
 */
export default class KeyMap {
  private _idsToKeys: Dict<Dict<string>>;
  private _keysToIds: Dict<Dict<string>>;

  constructor() {
    this.reset();
  }

  /**
   * Resets the contents of the key map.
   */
  reset(): void {
    this._idsToKeys = {};
    this._keysToIds = {};
  }

  /**
   * Return a key value given a model type, key name, and id.
   */
  idToKey(type: string, keyName: string, idValue: string): string {
    return deepGet(this._idsToKeys, [type, keyName, idValue]);
  }

  /**
   * Return an id value given a model type, key name, and key value.
   */
  keyToId(type: string, keyName: string, keyValue: string): string {
    return deepGet(this._keysToIds, [type, keyName, keyValue]);
  }

  /**
   * Store the id and key values of a record in this key map.
   */
  pushRecord(record: Record): void {
    const { type, id, keys } = record;

    if (!keys || !id) {
      return;
    }

    Object.keys(keys).forEach(keyName => {
      let keyValue = keys[keyName];
      if (keyValue) {
        deepSet(this._idsToKeys, [type, keyName, id], keyValue);
        deepSet(this._keysToIds, [type, keyName, keyValue], id);
      }
    });
  }

  /**
   * Given a record, find the cached id if it exists.
   */
  idFromKeys(type: string, keys: Dict<string>): string {
    let keyNames = Object.keys(keys);

    return firstResult(keyNames, keyName => {
      let keyValue = keys[keyName];
      if (keyValue) {
        return this.keyToId(type, keyName, keyValue);
      }
    });
  }
}
