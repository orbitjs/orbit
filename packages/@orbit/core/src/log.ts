import { Orbit } from './main';
import { evented, Evented } from './evented';
import { Bucket } from './bucket';
import { NotLoggedException, OutOfRangeException } from './exception';

const { assert } = Orbit;

export interface LogOptions {
  name?: string;
  data?: string[];
  bucket?: Bucket<string[]>;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Log
  extends Evented<'append' | 'truncate' | 'rollback' | 'clear' | 'change'> {}

/**
 * Logs track a series of unique events that have occurred. Each event is
 * tracked based on its unique id. The log only tracks the ids but currently
 * does not track any details.
 *
 * Logs can automatically be persisted by assigning them a bucket.
 */
@evented
export class Log {
  private _name?: string;
  private _bucket?: Bucket<string[]>;
  private _data: string[] = [];

  public reified!: Promise<void>;

  constructor(options: LogOptions = {}) {
    this._name = options.name;
    this._bucket = options.bucket;

    if (this._bucket) {
      assert('Log requires a name if it has a bucket', !!this._name);
    }

    this._reify(options.data);
  }

  get name(): string | undefined {
    return this._name;
  }

  get bucket(): Bucket<string[]> | undefined {
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

  append(...ids: string[]): Promise<void> {
    return this.reified
      .then(() => {
        Array.prototype.push.apply(this._data, ids);
        return this._persist();
      })
      .then(() => {
        this.emit('append', ids);
      });
  }

  before(id: string, relativePosition = 0): string[] {
    const index = this._data.indexOf(id);
    if (index === -1) {
      throw new NotLoggedException(id);
    }

    const position = index + relativePosition;
    if (position < 0 || position >= this._data.length) {
      throw new OutOfRangeException(position);
    }

    return this._data.slice(0, position);
  }

  after(id: string, relativePosition = 0): string[] {
    const index = this._data.indexOf(id);
    if (index === -1) {
      throw new NotLoggedException(id);
    }

    const position = index + 1 + relativePosition;
    if (position < 0 || position > this._data.length) {
      throw new OutOfRangeException(position);
    }

    return this._data.slice(position);
  }

  truncate(id: string, relativePosition = 0): Promise<void> {
    let removed: string[];

    return this.reified
      .then(() => {
        const index = this._data.indexOf(id);
        if (index === -1) {
          throw new NotLoggedException(id);
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
        this.emit('truncate', id, relativePosition, removed);
      });
  }

  rollback(id: string, relativePosition = 0): Promise<void> {
    let removed: string[];

    return this.reified
      .then(() => {
        const index = this._data.indexOf(id);
        if (index === -1) {
          throw new NotLoggedException(id);
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
        this.emit('rollback', id, relativePosition, removed);
      });
  }

  clear(): Promise<void> {
    let clearedData: string[];

    return this.reified
      .then(() => {
        clearedData = this._data;
        this._data = [];
        return this._persist();
      })
      .then(() => this.emit('clear', clearedData));
  }

  contains(id: string): boolean {
    return this._data.indexOf(id) > -1;
  }

  private async _persist(): Promise<void> {
    this.emit('change');
    if (this._bucket && this._name) {
      await this._bucket.setItem(this._name, this._data);
    }
  }

  private _reify(data?: string[]): Promise<void> {
    if (data) {
      this._initData(data);
      this.reified = Promise.resolve();
    } else {
      this.reified = this._loadDataFromBucket().then((bucketData) =>
        this._initData(bucketData)
      );
    }

    return this.reified;
  }

  private async _loadDataFromBucket(): Promise<string[] | undefined> {
    if (this._bucket && this._name) {
      return (await this._bucket.getItem(this._name)) as string[] | undefined;
    }
  }

  private _initData(data?: string[]): void {
    this._data = data ?? [];
  }
}
