import { assert, get, set, firstResult, Dict } from '@orbit/utils';
import { Record } from './record';

export default class KeyMap {
  private _data: Dict<any>;

  constructor() {
    this._data = {};
  }

  /**
   Return a key value given a type of model, key name and id.

   @param {String} type - type of model
   @param {String} keyName - the name of the key
   @param {String} idValue - the model id
   @returns {string} the model's key value
   */
  idToKey(type: string, keyName: string, idValue: string): string {
    return get(this._data, [type, keyName, 'idToKeyMap', idValue]);
  }

  /**
   Return an id value given a type of model, key name and key value.

   @param {String} type - type of model
   @param {String} keyName - the name of the key
   @param {String} keyValue - the value of the key to look up
   @returns {string} the model's id value
   */
  keyToId(type: string, keyName: string, keyValue: string): string {
    return get(this._data, [type, keyName, 'keyToIdMap', keyValue]);
  }

  /**
   Integrate the id and key values of a record into this keyMap.

   @param {Object} record - a data structure that represents a record
   @param {String} record.type - the type of model
   @param {String} record.id - the model's ID
   @param {Object} record.keys - a map of keys and their values
   @returns {undefined}
   */
  pushRecord(record: Record): void {
    const { type, id, keys } = record;

    if (!keys) {
      return;
    }

    Object.keys(keys).forEach(keyName => {
      let keyValue = keys[keyName];
      set(this._data, [type, keyName, 'idToKeyMap', id], keyValue);
      set(this._data, [type, keyName, 'keyToIdMap', keyValue], id);
    });
  }

  /**
   Given a record, find the cached ID if it exists.
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
