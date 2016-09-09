/* globals Immutable */
import Orbit from '../main';
import Evented from '../evented';
import { TransformNotLoggedException, OutOfRangeException } from '../lib/exceptions';

export default class TransformLog {
  constructor(data, options = {}) {
    this.name = options.name;
    this.bucket = options.bucket;
    this._reify(data);
  }

  get data() {
    return this._data;
  }

  get head() {
    return this._data.last();
  }

  get entries() {
    return this._data.toArray();
  }

  get length() {
    return this._data.size;
  }

  append(...transformIds) {
    let data;

    return this.reified
      .then(() => {
        data = this._data;
        this._data = data.push(...transformIds);
        return this._persist();
      })
      .then(() => {
        this.emit('append', transformIds, data);
      });
  }

  before(transformId, relativePosition = 0) {
    const index = this._data.indexOf(transformId);
    if (index === -1) {
      throw new TransformNotLoggedException(transformId);
    }

    const position = index + relativePosition;
    if (position < 0 || position >= this._data.size) {
      throw new OutOfRangeException(position);
    }

    return this._data.slice(0, position).toJS();
  }

  after(transformId, relativePosition = 0) {
    const index = this._data.indexOf(transformId);
    if (index === -1) {
      throw new TransformNotLoggedException(transformId);
    }

    const position = index + 1 + relativePosition;
    if (position < 0 || position > this._data.size) {
      throw new OutOfRangeException(position);
    }

    return this._data.slice(position).toJS();
  }

  truncate(transformId, relativePosition = 0) {
    let data;

    return this.reified
      .then(() => {
        data = this._data;
        const index = this._data.indexOf(transformId);
        if (index === -1) {
          throw new TransformNotLoggedException(transformId);
        }

        const position = index + relativePosition;
        if (position < 0 || position > this._data.size) {
          throw new OutOfRangeException(position);
        }

        if (position === this._data.length) {
          this._data = data.clear();
        } else {
          this._data = data.slice(position);
        }

        return this._persist();
      })
      .then(() => {
        this.emit('truncate', transformId, relativePosition, data);
      });
  }

  rollback(transformId, relativePosition = 0) {
    let data;

    return this.reified
      .then(() => {
        data = this._data;
        const index = this._data.indexOf(transformId);
        if (index === -1) {
          throw new TransformNotLoggedException(transformId);
        }

        const position = index + 1 + relativePosition;
        if (position < 0 || position > this._data.size) {
          throw new OutOfRangeException(position);
        }

        this._data = data.setSize(position);

        return this._persist();
      })
      .then(() => {
        this.emit('rollback', transformId, relativePosition, data);
      });
  }

  clear() {
    let data;

    return this.reified
      .then(() => {
        data = this._data;
        this._data = data.clear();
        return this._persist();
      })
      .then(() => this.emit('clear', data));
  }

  contains(transformId) {
    return this._data.includes(transformId);
  }

  _persist() {
    if (this.bucket) {
      return this.bucket.setItem(this.name, this._data.toJS());
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
      if (Immutable.List.isList(data)) {
        this._data = data;
      } else {
        this._data = new Immutable.List(data);
      }
    } else {
      this._data = new Immutable.List();
    }
  }
}

Evented.extend(TransformLog.prototype);
