import { isArray, expose } from '../../lib/objects';
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
export default class DeletionTrackingProcessor extends OperationProcessor {
  constructor(cache) {
    super(cache);
    this._del = {};
    expose(cache, this, 'hasDeleted');
  }

  hasDeleted(path) {
    if (isArray(path)) { path = path.join('/'); }
    return !!this._del[path];
  }

  reset() {
    this._del = {};
  }

  finally(operation) {
    if (operation.op === 'removeRecord') {
      const { type, id } = operation.record;
      const serializedPath = [type, id].join('/');
      this._del[serializedPath] = true;
    }

    return [];
  }
}
