import { get } from 'orbit/lib/objects';
import { firstResult } from 'orbit/lib/arrays';
import { assert } from 'orbit/lib/assert';

export default class KeyMap {
  constructor() {
    this._data = {};
  }

  /**
   Return a key value given a type of model, key name and id

   @param {String} type - type of model
   @param {String} keyName - the name of the key
   @param {String} idValue - the model id
   @returns {string} the model's key value
   */
  idToKey(type, keyName, idValue) {
    return get(this._data, type, keyName, 'idToKeyMap', idValue);
  }

  /**
   Return an id value given a type of model, key name and key value

   @param {String} type - type of model
   @param {String} keyName - the name of the key
   @param {String} keyValue - the value of the key to look up
   @returns {string} the model's id value
   */
  keyToId(type, keyName, keyValue) {
    return get(this._data, type, keyName, 'keyToIdMap', keyValue);
  }

  /**
   Given a data object structured according to this schema, register all of its
   key mappings. This data object may contain any number of records and types.

   @param {Object} document - data structured according to this schema
   @returns {undefined}
   */
  pushDocument(document) {
    if (!document) {
      return;
    }

    Object.keys(document).forEach(type => {
      let idRecordMap = document[type];
      Object.keys(idRecordMap).forEach(id => {
        let record = idRecordMap[id];
        this.pushRecord({
          type,
          id: record.id,
          keys: record.keys
        });
      });
    });
  }

  // TODO: use _.set pattern to clean this up and accept one key at a time per record
  /**
    Integrate the id and key values of a record into this keyMap.

    @param {Object} record - a data structure that represents a record
    @param {String} record.type - the type of model
    @param {String} record.id - the model's ID
    @param {Object} record.keys - a map of keys and their values
    @returns {undefined}
  */
  pushRecord({ type, id, keys }) {
    assert(`You pushed a ${type} record into the KeyMap that does not have an ID. Make sure you provide an Orbit ID to this record before pushing.`, id);

    if (!keys) {
      return;
    }

    let recordKeyNames = Object.keys(keys);

    let typeData = this._data[type];
    if (!typeData) {
      typeData = this._data[type] = this._initialTypeDataForKeys(recordKeyNames);
    }

    recordKeyNames.forEach(keyName => {
      let keyValue = keys[keyName];
      if (keyValue) {
        let typeKeyData = typeData[keyName];
        typeKeyData.idToKeyMap[id] = keyValue;
        typeKeyData.keyToIdMap[keyValue] = id;
      }
    });
  }

  /**
    Given a record, find the cached ID if it exists.

    @param {Object} record - a data structure that represents a record
    @returns {string|undefined} either the ID value or nothing
   */
  findIdForRecord(record) {
    if (!record.keys) {
      return;
    }

    let keyNames = Object.keys(record.keys);
    return firstResult(keyNames, (keyName) => {
      let keyValue = record.keys[keyName];
      if (keyValue) {
        return this.keyToId(record.type, keyName, keyValue);
      }
    });
  }

  _initialTypeDataForKeys(keyNames) {
    let typeData = {};

    keyNames.forEach(keyName => {
      typeData[keyName] = { keyToIdMap: {}, idToKeyMap: {} };
    });

    return typeData;
  }
}
