import hamt from './utils/hamt';

export default class ImmutableMap {
  private _data: any;

  constructor(base) {
    if (base) {
      this._data = base.data;
    } else {
      this._data = hamt.empty;
    }
  }

  get(key) {
    return this._data.get(key);
  }

  set(key, value) {
    this._data = this._data.set(key, value);
  }

  remove(key) {
    this._data = this._data.remove(key);
  }

  has(key) {
    return this.get(key) !== undefined;
  }

  get data() {
    return this._data;
  }

  get length() {
    return this._data.size;
  }

  get keys() {
    return Array.from(this._data.keys());
  }

  get values() {
    return Array.from(this._data.values());
  }
}
