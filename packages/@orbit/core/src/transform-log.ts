import Orbit from './main';
import evented, { Evented } from './evented';
import Bucket from './bucket';
import Transform from './transform';
import { TransformNotLoggedException, OutOfRangeException } from './exception';

@evented
export default class TransformLog implements Evented {
  private _name: string;
  private _bucket: Bucket;
  private _data: string[];

  public reified: Promise<void>;

  // Evented interface stubs
  on: (event: string, callback: () => void, binding?: any) => void;
  off: (event: string, callback: () => void, binding?: any) => void;
  one: (event: string, callback: () => void, binding?: any) => void;
  emit: (event: string, ...args) => void;
  listeners: (event: string) => any[];

  constructor(name?: string, data?: string[], bucket?: Bucket) {
    this._name = name;
    this._bucket = bucket;
    this._reify(data);
  }

  get name(): string {
    return this._name;
  }

  get bucket(): Bucket {
    return this._bucket;
  }

  get head(): string {
    return this._data[this._data.length - 1];
  }

  get entries(): string[] {
    return this._data;
  }

  get length(): number {
    return this._data.length;
  }

  append(...transformIds: string[]): Promise<void> {
    return this.reified
      .then(() => {
        Array.prototype.push.apply(this._data, transformIds);
        return this._persist();
      })
      .then(() => {
        this.emit('append', transformIds);
      });
  }

  before(transformId: string, relativePosition: number = 0): string[] {
    const index = this._data.indexOf(transformId);
    if (index === -1) {
      throw new TransformNotLoggedException(transformId);
    }

    const position = index + relativePosition;
    if (position < 0 || position >= this._data.length) {
      throw new OutOfRangeException(position);
    }

    return this._data.slice(0, position);
  }

  after(transformId: string, relativePosition: number = 0): string[] {
    const index = this._data.indexOf(transformId);
    if (index === -1) {
      throw new TransformNotLoggedException(transformId);
    }

    const position = index + 1 + relativePosition;
    if (position < 0 || position > this._data.length) {
      throw new OutOfRangeException(position);
    }

    return this._data.slice(position);
  }

  truncate(transformId: string, relativePosition: number = 0): Promise<void> {
    let removed: string[];

    return this.reified
      .then(() => {
  
        const index = this._data.indexOf(transformId);
        if (index === -1) {
          throw new TransformNotLoggedException(transformId);
        }

        const position = index + relativePosition;
        if (position < 0 || position > this._data.length) {
          throw new OutOfRangeException(position);
        }

        if (position === this._data.length) {
          removed = this._data;
          this._data = [];
        } else {
          removed = this._data.slice(0, position);
          this._data = this._data.slice(position);
        }

        return this._persist();
      })
      .then(() => {
        this.emit('truncate', transformId, relativePosition, removed);
      });
  }

  rollback(transformId: string, relativePosition: number = 0): Promise<void> {
    let removed: string[];

    return this.reified
      .then(() => {
        const index = this._data.indexOf(transformId);
        if (index === -1) {
          throw new TransformNotLoggedException(transformId);
        }

        const position = index + 1 + relativePosition;
        if (position < 0 || position > this._data.length) {
          throw new OutOfRangeException(position);
        }

        removed = this._data.slice(position);
        this._data = this._data.slice(0, position);

        return this._persist();
      })
      .then(() => {
        this.emit('rollback', transformId, relativePosition, removed);
      });
  }

  clear(): Promise<void> {
    let clearedData;

    return this.reified
      .then(() => {
        clearedData = this._data;
        this._data = [];
        return this._persist();
      })
      .then(() => this.emit('clear', clearedData));
  }

  contains(transformId: string): boolean {
    return this._data.includes(transformId);
  }

  _persist(): Promise<void> {
    if (this.bucket) {
      return this._bucket.setItem(this.name, this._data);
    } else {
      return Orbit.Promise.resolve();
    }
  }

  _reify(data: string[]): void {
    if (!data && this._bucket) {
      this.reified = this._bucket.getItem(this._name)
        .then(bucketData => this._initData(bucketData));
    } else {
      this._initData(data);
      this.reified = Orbit.Promise.resolve();
    }
  }

  _initData(data: string[]): void {
    if (data) {
      this._data = data;
    } else {
      this._data = [];
    }
  }
}
