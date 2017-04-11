import { assert, deepGet, deepSet, firstResult, Dict } from '@orbit/utils';
import { Record } from './record';

/**
 * Maintains a map between records' ids and keys.
 * 
 * @export
 * @class KeyMap
 */
export default class KeyMap {
  private _data: Dict<any>;

  constructor() {
    this._data = {};
  }

  /**
   * Return a key value given a model type, key name, and id.
   * 
   * @param {string} type 
   * @param {string} keyName 
   * @param {string} idValue 
   * @returns {string} 
   * 
   * @memberOf KeyMap
   */
  idToKey(type: string, keyName: string, idValue: string): string {
    return deepGet(this._data, [type, keyName, 'idToKeyMap', idValue]);
  }

  /**
   * Return an id value given a model type, key name, and key value.
   * 
   * @param {string} type 
   * @param {string} keyName 
   * @param {string} keyValue 
   * @returns {string} 
   * 
   * @memberOf KeyMap
   */
  keyToId(type: string, keyName: string, keyValue: string): string {
    return deepGet(this._data, [type, keyName, 'keyToIdMap', keyValue]);
  }

  /**
   * Store the id and key values of a record in this key map.
   * 
   * @param {Record} record 
   * @returns {void} 
   * 
   * @memberOf KeyMap
   */
  pushRecord(record: Record): void {
    const { type, id, keys } = record;

    if (!keys) {
      return;
    }

    Object.keys(keys).forEach(keyName => {
      let keyValue = keys[keyName];
      deepSet(this._data, [type, keyName, 'idToKeyMap', id], keyValue);
      deepSet(this._data, [type, keyName, 'keyToIdMap', keyValue], id);
    });
  }

  /**
   * Given a record, find the cached id if it exists.
   * 
   * @param {string} type 
   * @param {Dict<string>} keys 
   * @returns {string} 
   * 
   * @memberOf KeyMap
   */
  idFromKeys(type: string, keys: Dict<string>): string {
    let keyNames = Object.keys(keys);

    return firstResult(keyNames, (keyName) => {
      let keyValue = keys[keyName];
      if (keyValue) {
        return this.keyToId(type, keyName, keyValue);
      }
    });
  }
}
