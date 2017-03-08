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

  get(key): any {
    return this._data.get(key);
  }

  set(key, value): void {
    this._data = this._data.set(key, value);
  }

  remove(key): void {
    this._data = this._data.remove(key);
  }

  has(key): boolean {
    return this.get(key) !== undefined;
  }

  get data(): any {
    return this._data;
  }

  get length(): number {
    return this._data.size;
  }

  get keys(): any[] {
    return Array.from(this._data.keys());
  }

  get values(): any[] {
    return Array.from(this._data.values());
  }
}
