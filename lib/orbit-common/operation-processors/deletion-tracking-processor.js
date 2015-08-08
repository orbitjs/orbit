import { Class, isArray, expose } from 'orbit/lib/objects';
import Operation from 'orbit/operation';
import OperationProcessor from './operation-processor';

/**
 An operation processor that tracks deletions from a cache to ensure that
 deletion operations are not unnecessarily repeated.

 This is useful in a "sparse" cache which does not represent an entire data set.

 When this processor is initialized, it introduces a `hasDeleted` method on the
 cache.

 @class DeletionTrackingProcessor
 @namespace OC
 @extends OperationProcessor
 @param {OC.Cache} [cache] Cache that is monitored.
 @constructor
 */
export default OperationProcessor.extend({
  init: function(cache) {
    this._super.apply(this, arguments);
    this._del = {};
    expose(cache, this, 'hasDeleted');
  },

  _del: null,

  hasDeleted: function(path) {
    if (isArray(path)) path = path.join('/');
    return !!this._del[path];
  },

  reset: function(data) {
    this._del = {};
  },

  finally: function(operation) {
    if (operation.op === 'remove') {
      var serializedPath = operation.path.join('/');
      this._del[serializedPath] = true;
    }

    return [];
  }
});
