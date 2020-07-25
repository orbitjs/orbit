import { HAMTMap } from './utils/hamt';

export class ImmutableMap<K, V> {
  private _data: HAMTMap;

  constructor(base?: ImmutableMap<K, V>) {
    if (base) {
      this._data = base.data;
    } else {
      this._data = new HAMTMap();
    }
  }

  get size(): number {
    return this._data.size;
  }

  clear(): void {
    this._data = new HAMTMap();
  }

  get(key: K): V {
    return this._data.get(key);
  }

  set(key: K, value: V): void {
    this._data = this._data.set(key, value);
  }

  setMany(entries: [K, V][]): void {
    let data = this._data.beginMutation();
    entries.forEach((entry) => {
      data.set(entry[0], entry[1]);
    });
    this._data = data.endMutation();
  }

  remove(key: K): void {
    this._data = this._data.remove(key);
  }

  removeMany(keys: K[]): void {
    let data = this._data.beginMutation();
    keys.forEach((key) => {
      data.remove(key);
    });
    this._data = data.endMutation();
  }

  has(key: K): boolean {
    return this.get(key) !== undefined;
  }

  keys(): IterableIterator<K> {
    return this._data.keys();
  }

  values(): IterableIterator<V> {
    return this._data.values();
  }

  entries(): IterableIterator<[K, V]> {
    return this._data.entries();
  }

  protected get data(): HAMTMap {
    return this._data;
  }
}
