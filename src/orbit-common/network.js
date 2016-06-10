import { assert } from 'orbit/lib/assert';
import KeyMap from 'orbit-common/key-map';

export default class Network {
  constructor(schema) {
    assert('Networks\'s `schema` must be passed in the constructor', schema);

    this.schema = schema;
    this.keyMap = new KeyMap(schema);
  }

  initializeRecord(data) {
    data.id = data.id || this.keyMap.findIdForRecord(data);
    this.schema.normalize(data);

    if (data.id) {
      this.keyMap.push(data);
    }

    return data;
  }

  initializeId(type, keyName, keyValue) {
    let existingId = this.keyMap.keyToId(type, keyName, keyValue);

    if (existingId) {
      return existingId;
    }

    let generatedId = this.schema.defaultId(type, keyName);

    if (!generatedId) {
      return generatedId;
    }

    this.keyMap.push({
      type,
      id: generatedId,
      keys: {
        [keyName]: keyValue
      }
    });

    return generatedId;
  }
}
