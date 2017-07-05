import hamt from './utils/hamt';

export default class ImmutableMap<K, V> {
  private _data: any;

  constructor(base?: ImmutableMap<K, V>) {
    if (base) {
      this._data = base.data;
    } else {
      this._data = hamt.empty;
    }
  }

  get size(): number {
    return this._data.size;
  }

  get(key: K): V {
    return this._data.get(key);
  }

  set(key: K, value: V): void {
    this._data = this._data.set(key, value);
  }

  remove(key: K): void {
    this._data = this._data.remove(key);
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

  protected get data(): any {
    return this._data;
  }
}
