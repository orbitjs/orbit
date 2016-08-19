/* globals Immutable */
import Evented from '../evented';
import { TransformNotLoggedException, OutOfRangeException } from '../lib/exceptions';

export default class TransformLog {
  constructor(data) {
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

  append(transformId) {
    const data = this._data;

    this._data = data.push(transformId);

    this.emit('append', transformId, data);
  }

  before(transformId, relativePosition = 0) {
    const index = this._indexOf(transformId);
    const position = index + relativePosition;
    if (position < 0 || position >= this._data.size) { this._throwOutOfRange(position); }

    return this._data.slice(0, position).toJS();
  }

  after(transformId, relativePosition = 0) {
    const index = this._indexOf(transformId);
    const position = index + 1 + relativePosition;
    if (position < 0 || position > this._data.size) { this._throwOutOfRange(position); }

    return this._data.slice(position).toJS();
  }

  truncate(transformId, relativePosition = 0) {
    const data = this._data;
    const index = this._indexOf(transformId);
    const position = index + relativePosition;
    if (position < 0 || position > this._data.size) { this._throwOutOfRange(position); }

    if (position === this._data.length) {
      this._data = data.clear();
    } else {
      this._data = data.slice(position);
    }

    this.emit('truncate', transformId, relativePosition, data);
  }

  rollback(transformId, relativePosition = 0) {
    const data = this._data;
    const index = this._indexOf(transformId);
    const position = index + 1 + relativePosition;
    if (position < 0 || position > this._data.size) { this._throwOutOfRange(position); }

    this._data = data.setSize(position);

    this.emit('rollback', transformId, relativePosition, data);
  }

  clear() {
    const data = this._data;
    this._data = data.clear();

    this.emit('clear', data);
  }

  contains(transformId) {
    return this._data.includes(transformId);
  }

  _indexOf(transformId) {
    const index = this._data.indexOf(transformId);
    return index !== -1 ? index : this._throwTransformNotLogged(transformId);
  }

  _throwTransformNotLogged(transformId) {
    throw new TransformNotLoggedException(transformId);
  }

  _throwOutOfRange(position) {
    throw new OutOfRangeException(position);
  }
}

Evented.extend(TransformLog.prototype);
