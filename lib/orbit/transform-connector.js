import ActionQueue from './action-queue';
import { Class, clone, isNone } from './lib/objects';
import { diffs } from './lib/diffs';
import { eq } from './lib/eq';
import { arrayToOptions } from './lib/config';

/**
 A `TransformConnector` observes a source's transforms and applies them to a
 target.

 Each connector is "one way", so bi-directional synchronization between sources
 requires the creation of two connectors.

 A `TransformConnector` can operate in one of two modes:

 - In the default "blocking" mode, a connector will return a promise to the
 `didTransform` event, which will prevent the original transform from resolving
 until the promise itself has resolved.

 - In "non-blocking" mode, transforms do not block the resolution of the original
 transform - asynchronous actions are performed afterward.

 The connector's `transform` method actually applies transforms to its target.
 This method attempts to retrieve the current value at the path of the
 transformation and resolves any conflicts with the connector's
 `resolveConflicts` method. By default, a simple differential is applied to the
 target, although both `transform` and `resolveConflicts` can be overridden to
 apply an alternative differencing algorithm.

 @class TransformConnector
 @namespace Orbit
 @param {Object}  source
 @param {Object}  target
 @param {Object}  [options]
 @param {String}  [options.blocking=true] Does the connector wait for promises to be settled?
 @param {Boolean} [options.active=true] Is the connector is actively observing the `source`?
 @param {Boolean} [options.rollbackTransformsOnFailure=false] Does the connector rollback transforms on the source when the target fails?
 @constructor
 */
var TransformConnector = Class.extend({
  init: function(source, target, options) {
    this.source = source;
    this.target = target;

    options = options || {};
    this.blocking = options.blocking !== undefined ? options.blocking : true;
    this.rollbackTransformsOnFailure = options.rollbackTransformsOnFailure !== undefined ? options.rollbackTransformsOnFailure : false;
    var active = options.active !== undefined ? options.active : true;

    if (active) this.activate();
  },

  activate: function() {
    if (this._active) return;

    this.source.on('didTransform',  this._processTransform,  this);

    this._active = true;
  },

  deactivate: function() {
    this.source.off('didTransform',  this._processTransform,  this);

    this._active = false;
  },

  isActive: function() {
    return this._active;
  },

  transform: function(operation) {
    // console.log('****', ' transform from ', this.source.id, ' to ', this.target.id, operation);

    if (this.target.retrieve) {
      var currentValue = this.target.retrieve(operation.path);

      // console.log('currentValue', currentValue, ' transform from ', this.source.id, ' to ', this.target.id, operation);

      if (!isNone(currentValue) && (operation.op === 'add' || operation.op === 'replace')) {
        if (eq(currentValue, operation.value)) {
          // console.log('==', ' transform from ', this.source.id, ' to ', this.target.id, operation);
          return;
        } else {
          return this.resolveConflicts(operation.path, currentValue, operation.value);
        }

      } else if (isNone(currentValue) && operation.op === 'remove') {
        return;
      }
    }

    return this.target.transform(operation);
  },

  resolveConflicts: function(path, currentValue, updatedValue) {
    var ops = diffs(currentValue, updatedValue, {basePath: path});

    // console.log(this.target.id, 'resolveConflicts', path, currentValue, updatedValue, ops);

    return this.target.transform(ops);
  },

  /**
   @method filterFunction
   @param {Object} operation
   @return {Boolean} `true` if the operation should be processed
   */
  filterFunction: null,

  /////////////////////////////////////////////////////////////////////////////
  // Internals
  /////////////////////////////////////////////////////////////////////////////

  _processTransform: function(operation, inverseOps) {
    // console.log('****', ' processTransform from ', this.source.id, ' to ', this.target.id, operation);

    if (this.filterFunction) {
      if (!this.filterFunction(operation)) return;
    }

    if (this.blocking) {
      return this._applyTransform(operation, inverseOps);

    } else {
      this._applyTransform(operation, inverseOps);
    }
  },

  _applyTransform: function(operation, inverseOps) {
    var transform = this.transform(operation);

    if (this.rollbackTransformsOnFailure && transform && transform.then) {
      var _this = this;
      transform.then(null, function() {
        return _this.source.transform(inverseOps);
      });
    }

    return transform;
  }
});

export default TransformConnector;
