import Orbit from '../main';
import evented from '../evented';
import { TransformNotLoggedException, OutOfRangeException } from '../lib/exceptions';

@evented
export default class TransformLog {
  constructor(data, options = {}) {
    this.name = options.name;
    this.bucket = options.bucket;
    this._reify(data);
  }

  get head() {
    return this._data[this._data.length - 1];
  }

  get entries() {
    return this._data;
  }

  get length() {
    return this._data.length;
  }

  append(...transformIds) {
    return this.reified
      .then(() => {
        Array.prototype.push.apply(this._data, transformIds);
        return this._persist();
      })
      .then(() => {
        this.emit('append', transformIds);
      });
  }

  before(transformId, relativePosition = 0) {
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

  after(transformId, relativePosition = 0) {
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

  truncate(transformId, relativePosition = 0) {
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
          this._data = [];
        } else {
          this._data = this._data.slice(position);
        }

        return this._persist();
      })
      .then(() => {
        this.emit('truncate', transformId, relativePosition);
      });
  }

  rollback(transformId, relativePosition = 0) {
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

        this._data = this._data.slice(0, position);

        return this._persist();
      })
      .then(() => {
        this.emit('rollback', transformId, relativePosition);
      });
  }

  clear() {
    let data;

    return this.reified
      .then(() => {
        this._data = [];
        return this._persist();
      })
      .then(() => this.emit('clear', data));
  }

  contains(transformId) {
    return this._data.includes(transformId);
  }

  _persist() {
    if (this.bucket) {
      return this.bucket.setItem(this.name, this._data);
    } else {
      return Orbit.Promise.resolve();
    }
  }

  _reify(data) {
    if (!data && this.bucket) {
      this.reified = this.bucket.getItem(this.name)
        .then(bucketData => this._initData(bucketData));
    } else {
      this._initData(data);
      this.reified = Orbit.Promise.resolve();
    }
  }

  _initData(data) {
    if (data) {
      this._data = data;
    } else {
      this._data = [];
    }
  }
}
