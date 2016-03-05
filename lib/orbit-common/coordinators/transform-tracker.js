import Orbit from 'orbit/main';
import { Class } from 'orbit/lib/objects';

function deferred() {
  let deferred = {};

  deferred.promise = new Orbit.Promise((resolve, reject) => {
    deferred.resolve = resolve;
    deferred.reject = reject;
  });

  return deferred;
}

export default Class.extend({
  init() {
    this._pendingTransforms = {};
  },

  add(transform) {
    console.log('add', transform.id);
    this._pendingTransforms[transform.id] = deferred();
    return this._pendingTransforms[transform.id].promise;
  },

  confirm(transform) {
    console.log('confirm', transform.id);
    const deferred = this._findDeferred(transform);
    deferred && deferred.resolve();
  },

  deny(transform, error) {
    const deferred = this._findDeferred(transform);
    deferred && deferred.reject(error);
  },

  _findDeferred(transform) {
    return this._pendingTransforms[transform.id];
  }
});
