import { get } from 'orbit/lib/objects';
import { firstResult } from 'orbit/lib/arrays';
import { assert } from 'orbit/lib/assert';

export default class KeyMap {
  constructor() {
    this._data = {};
  }

  idToKey(type, keyName, idValue, autoGenerate) {
    // TODO: find instances of using autoGenerate and refactor
    assert('stop using autogenerate', !autoGenerate);
    return get(this._data, type, keyName, 'idToKeyMap', idValue);
  }

  keyToId(type, keyName, keyValue, autoGenerate) {
    // TODO: find instances of using autoGenerate and refactor
    assert('stop using autogenerate', !autoGenerate);
    return get(this._data, type, keyName, 'keyToIdMap', keyValue);
  }

  /**
   Given a data object structured according to this schema, register all of its
   key mappings. This data object may contain any number of records and types.

   @param {Object} data - data structured according to this schema
   @returns {undefined}
   */
  registerDocument(data) {
    if (!data) {
      return;
    }

    Object.keys(data).forEach(type => {
      let idRecordMap = data[type];
      Object.keys(idRecordMap).forEach(id => {
        let record = idRecordMap[id];
        this.push({
          type,
          id: record.id,
          keys: record.keys
        });
      });
    });
  }

  // TODO: use _.set pattern to clean this up and accept one key at a time per record
  push({ type, id, keys }) {
    assert(`You pushed a ${type} record into the KeyMap that does not have an ID. Make sure you provide an Orbit ID to this record before pushing.`, id);

    if (!keys) {
      return;
    }

    let recordKeyNames = Object.keys(keys);

    let typeData = this._data[type];
    if (!typeData) {
      typeData = this._data[type] = this.initialTypeDataForKeys(recordKeyNames);
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

  initialTypeDataForKeys(keyNames) {
    let typeData = {};

    keyNames.forEach(keyName => {
      typeData[keyName] = { keyToIdMap: {}, idToKeyMap: {} };
    });

    return typeData;
  }

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
}
