import { deferred } from 'orbit/lib/promises';

export default class RequestTracker {
  constructor() {
    this._pending = {};
  }

  add(id) {
    // console.log('add', id);
    return this._findDeferred(id).promise;
  }

  confirm(id) {
    // console.log('confirm', id);
    this._findDeferred(id).resolve();
  }

  deny(id, error) {
    // console.log('deny', id);
    this._findDeferred(id).reject(error);
  }

  _findDeferred(id) {
    if (!this._pending[id]) {
      this._pending[id] = deferred();
    }

    return this._pending[id];
  }
}
