import { assert } from 'orbit/lib/assert';
import KeyMap from 'orbit-common/key-map';

export default class Network {
  constructor(schema) {
    assert('Networks\'s `schema` must be passed in the constructor', schema);

    this.schema = schema;
    this.keyMap = new KeyMap(schema);
  }
}
