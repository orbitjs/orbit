import { IdentitySerializer } from './identity-serializer';

export interface IdentityMapSettings<Identity> {
  serializer: IdentitySerializer<Identity>;
}

export class IdentityMap<Identity, Model> implements Map<Identity, Model> {
  protected _serializer: IdentitySerializer<Identity>;
  protected _map: Map<string, Model>;

  constructor(settings: IdentityMapSettings<Identity>) {
    this._serializer = settings.serializer;
    this._map = new Map();
  }

  get(identity: Identity): Model | undefined {
    const identifier = this._serializer.serialize(identity);
    if (identifier !== undefined) {
      return this._map.get(identifier);
    }
  }

  set(identity: Identity, record: Model): this {
    const identifier = this._serializer.serialize(identity);
    if (identifier !== undefined) {
      this._map.set(identifier, record);
    }
    return this;
  }

  has(identity: Identity): boolean {
    const identifier = this._serializer.serialize(identity);
    if (identifier !== undefined) {
      return this._map.has(identifier);
    } else {
      return false;
    }
  }

  delete(identity: Identity): boolean {
    const identifier = this._serializer.serialize(identity);
    const result = this._map.has(identifier);
    if (result) {
      this._map.delete(identifier);
    }
    return result;
  }

  entries(): IterableIterator<[Identity, Model]> {
    return Array.from(this._map)
      .map(([identifier, record]): [Identity, Model] => [
        this._serializer.deserialize(identifier),
        record
      ])
      [Symbol.iterator]();
  }

  keys(): IterableIterator<Identity> {
    return Array.from(this)
      .map(([identity]) => identity)
      [Symbol.iterator]();
  }

  values(): IterableIterator<Model> {
    return this._map.values();
  }

  [Symbol.iterator](): IterableIterator<[Identity, Model]> {
    return this.entries();
  }

  clear(): void {
    this._map.clear();
  }

  forEach(
    callbackFn: (
      record: Model,
      identity: Identity,
      map: IdentityMap<Identity, Model>
    ) => void,
    thisArg?: unknown
  ): void {
    for (let [identity, record] of this) {
      callbackFn.call(thisArg, record, identity, this);
    }
  }

  get size(): number {
    return this._map.size;
  }

  get [Symbol.toStringTag](): string {
    return 'IdentityMap';
  }
}
