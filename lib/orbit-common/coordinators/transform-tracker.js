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
    this._pendingTransforms[transform.id] = deferred();
    return this._pendingTransforms[transform.id].promise;
  },

  confirm(transform) {
    this._pendingTransforms[transform.id].resolve(transform);
  }
});
