import Orbit from 'orbit/main';
import { Class } from 'orbit/lib/objects';
import { deferred } from 'orbit/lib/promises';


export default class TransformTracker {
  constructor() {
    this._pendingTransforms = {};
  }

  add(transform) {
    // console.log('add', transform.id);
    return this._findDeferred(transform).promise;
  }

  confirm(transform) {
    // console.log('confirm', transform.id);
    this._findDeferred(transform).resolve();
  }

  deny(transform, error) {
    // console.log('deny', transform.id);
    this._findDeferred(transform).reject(error);
  }

  _findDeferred(transform) {
    if (!this._pendingTransforms[transform.id]) {
      this._pendingTransforms[transform.id] = deferred();
    }

    return this._pendingTransforms[transform.id];
  }
}
