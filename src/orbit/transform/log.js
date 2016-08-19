import { TransformNotLoggedException, OutOfRangeException } from 'orbit/lib/exceptions';

export default class TransformLog {
  constructor() {
    this._log = [];
  }

  append(transformId) {
    this._log.push(transformId);
  }

  get head() {
    return this._log[this._log.length - 1];
  }

  get entries() {
    return this._log;
  }

  get length() {
    return this._log.length;
  }

  before(transformId, relativePosition = 0) {
    const index = this._indexOf(transformId);
    const position = index + relativePosition;
    if (position < 0 || position >= this._log.length) { this._throwOutOfRange(position); }

    return this._log.slice(0, position);
  }

  after(transformId, relativePosition = 0) {
    const index = this._indexOf(transformId);
    const position = index + 1 + relativePosition;
    if (position < 0 || position > this._log.length) { this._throwOutOfRange(position); }

    return this._log.slice(position);
  }

  truncate(transformId, relativePosition = 0) {
    const index = this._indexOf(transformId);
    const position = index + relativePosition;
    if (position < 0 || position > this._log.length) { this._throwOutOfRange(position); }

    if (position === this._log.length) {
      this.clear();
    } else {
      this._log = this._log.slice(position);
    }
  }

  rollback(transformId, relativePosition = 0) {
    const index = this._indexOf(transformId);
    const position = index + 1 + relativePosition;
    if (position < 0 || position > this._log.length) { this._throwOutOfRange(position); }

    this._log.length = position;
  }

  clear() {
    this._log = [];
  }

  contains(transformId) {
    return this._log.indexOf(transformId) !== -1;
  }

  _indexOf(transformId) {
    const index = this._log.indexOf(transformId);
    return index !== -1 ? index : this._throwTransformNotLogged(transformId);
  }

  _throwTransformNotLogged(transformId) {
    throw new TransformNotLoggedException(transformId);
  }

  _throwOutOfRange(position) {
    throw new OutOfRangeException(position);
  }
}
